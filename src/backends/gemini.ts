/**
 * Gemini Backend - Executes prompts via Google's Gemini CLI
 */

import { spawn } from 'child_process';
import { BackendExecutor, BackendConfig, BackendType } from './types.js';
import { Logger } from '../utils/logger.js';
import {
  ERROR_MESSAGES,
  STATUS_MESSAGES,
  MODELS,
  CLI
} from '../constants.js';

export class GeminiBackend implements BackendExecutor {
  name: BackendType = 'gemini';

  async execute(
    prompt: string,
    config: BackendConfig,
    onProgress?: (output: string) => void
  ): Promise<string> {
    let processedPrompt = prompt;

    // Apply changeMode instructions if enabled
    if (config.changeMode) {
      processedPrompt = this.applyChangeModeInstructions(prompt);
    }

    const args = this.buildArgs(processedPrompt, config);

    try {
      return await this.executeCommand(args, onProgress, config.cwd);
    } catch (error) {
      // Handle quota exceeded with fallback to Flash model
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes(ERROR_MESSAGES.QUOTA_EXCEEDED) && config.model !== MODELS.FLASH) {
        Logger.warn(`${ERROR_MESSAGES.QUOTA_EXCEEDED}. Falling back to ${MODELS.FLASH}.`);
        onProgress?.(STATUS_MESSAGES.FLASH_RETRY);

        const fallbackConfig = { ...config, model: MODELS.FLASH };
        const fallbackArgs = this.buildArgs(processedPrompt, fallbackConfig);

        try {
          const result = await this.executeCommand(fallbackArgs, onProgress, config.cwd);
          Logger.warn(`Successfully executed with ${MODELS.FLASH} fallback.`);
          onProgress?.(STATUS_MESSAGES.FLASH_SUCCESS);
          return result;
        } catch (fallbackError) {
          const fallbackErrorMessage = fallbackError instanceof Error
            ? fallbackError.message
            : String(fallbackError);
          throw new Error(
            `${MODELS.PRO} quota exceeded, ${MODELS.FLASH} fallback also failed: ${fallbackErrorMessage}`
          );
        }
      }
      throw error;
    }
  }

  async isAvailable(): Promise<boolean> {
    return new Promise((resolve) => {
      const child = spawn('which', ['gemini'], { shell: true });
      child.on('close', (code) => resolve(code === 0));
      child.on('error', () => resolve(false));
    });
  }

  getModels(): string[] {
    return [
      MODELS.PRO_3,
      MODELS.FLASH_3,
      MODELS.PRO,
      MODELS.FLASH
    ];
  }

  supportsFileRefs(): boolean {
    return true;
  }

  getFileRefSyntax(): string {
    return '@';
  }

  private buildArgs(prompt: string, config: BackendConfig): string[] {
    const args: string[] = [];

    if (config.model) {
      args.push(CLI.FLAGS.MODEL, config.model);
    }

    if (config.sandbox) {
      args.push(CLI.FLAGS.SANDBOX);
    }

    // Add allowed tools for auto-approval
    if (config.allowedTools && config.allowedTools.length > 0) {
      for (const tool of config.allowedTools) {
        args.push(CLI.FLAGS.ALLOWED_TOOLS, tool);
      }
    }

    // Ensure @ symbols work cross-platform by wrapping in quotes if needed
    const finalPrompt = prompt.includes('@') && !prompt.startsWith('"')
      ? `"${prompt}"`
      : prompt;

    args.push(CLI.FLAGS.PROMPT, finalPrompt);

    return args;
  }

  private applyChangeModeInstructions(prompt: string): string {
    const processedPrompt = prompt.replace(/file:(\S+)/g, '@$1');

    return `
[CHANGEMODE INSTRUCTIONS]
You are generating code modifications that will be processed by an automated system. The output format is critical because it enables programmatic application of changes without human intervention.

INSTRUCTIONS:
1. Analyze each provided file thoroughly
2. Identify locations requiring changes based on the user request
3. For each change, output in the exact format specified
4. The OLD section must be EXACTLY what appears in the file (copy-paste exact match)
5. Provide complete, directly replacing code blocks
6. Verify line numbers are accurate

CRITICAL REQUIREMENTS:
1. Output edits in the EXACT format specified below - no deviations
2. The OLD string MUST be findable with Ctrl+F - it must be a unique, exact match
3. Include enough surrounding lines to make the OLD string unique
4. If a string appears multiple times (like </div>), include enough context lines above and below to make it unique
5. Copy the OLD content EXACTLY as it appears - including all whitespace, indentation, line breaks
6. Never use partial lines - always include complete lines from start to finish

OUTPUT FORMAT (follow exactly):
**FILE: [filename]:[line_number]**
\`\`\`
OLD:
[exact code to be replaced - must match file content precisely]
NEW:
[new code to insert - complete and functional]
\`\`\`

EXAMPLE 1 - Simple unique match:
**FILE: src/utils/helper.js:100**
\`\`\`
OLD:
function getMessage() {
  return "Hello World";
}
NEW:
function getMessage() {
  return "Hello Universe!";
}
\`\`\`

EXAMPLE 2 - Common tag needing context:
**FILE: index.html:245**
\`\`\`
OLD:
        </div>
      </div>
    </section>
NEW:
        </div>
      </footer>
    </section>
\`\`\`

IMPORTANT: The OLD section must be an EXACT copy from the file that can be found with Ctrl+F!

USER REQUEST:
${processedPrompt}
`;
  }

  private executeCommand(
    args: string[],
    onProgress?: (output: string) => void,
    cwd?: string
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      Logger.commandExecution(CLI.COMMANDS.GEMINI, args, startTime);

      const childProcess = spawn(CLI.COMMANDS.GEMINI, args, {
        env: process.env,
        shell: false,
        stdio: ['ignore', 'pipe', 'pipe'],
        cwd: cwd || process.cwd(),
      });

      let stdout = '';
      let stderr = '';
      let isResolved = false;
      let lastReportedLength = 0;

      childProcess.stdout.on('data', (data) => {
        stdout += data.toString();

        if (onProgress && stdout.length > lastReportedLength) {
          const newContent = stdout.substring(lastReportedLength);
          lastReportedLength = stdout.length;
          onProgress(newContent);
        }
      });

      childProcess.stderr.on('data', (data) => {
        stderr += data.toString();
        if (stderr.includes('RESOURCE_EXHAUSTED')) {
          const modelMatch = stderr.match(/Quota exceeded for quota metric '([^']+)'/);
          const model = modelMatch ? modelMatch[1] : 'Unknown Model';
          Logger.error(`Gemini Quota Error: Quota exceeded for ${model}`);
        }
      });

      childProcess.on('error', (error) => {
        if (!isResolved) {
          isResolved = true;
          Logger.error('Process error:', error);
          reject(new Error(`Failed to spawn gemini command: ${error.message}`));
        }
      });

      childProcess.on('close', (code) => {
        if (!isResolved) {
          isResolved = true;
          if (code === 0) {
            Logger.commandComplete(startTime, code, stdout.length);
            resolve(stdout.trim());
          } else {
            Logger.commandComplete(startTime, code);
            Logger.error(`Failed with exit code ${code}`);
            const errorMessage = stderr.trim() || 'Unknown error';
            reject(new Error(`Gemini command failed with exit code ${code}: ${errorMessage}`));
          }
        }
      });
    });
  }
}
