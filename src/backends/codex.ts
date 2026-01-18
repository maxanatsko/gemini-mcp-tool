/**
 * Codex Backend - Executes prompts via OpenAI's Codex CLI
 *
 * Uses `codex exec` for non-interactive execution mode.
 * Codex CLI does not support @file syntax, so files must be read and inlined.
 */

import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { BackendExecutor, BackendConfig, BackendType } from './types.js';
import { Logger } from '../utils/logger.js';
import { CODEX_CLI, CODEX_MODELS } from '../constants.js';

export class CodexBackend implements BackendExecutor {
  name: BackendType = 'codex';

  async execute(
    prompt: string,
    config: BackendConfig,
    onProgress?: (output: string) => void
  ): Promise<string> {
    // Translate @file references to inline content since Codex doesn't support them
    const processedPrompt = this.translateFileRefs(prompt, config.cwd);

    // Apply changeMode instructions if enabled
    const finalPrompt = config.changeMode
      ? this.applyChangeModeInstructions(processedPrompt)
      : processedPrompt;

    const args = this.buildArgs(config);

    return this.executeCommand(args, finalPrompt, onProgress, config.cwd);
  }

  async isAvailable(): Promise<boolean> {
    return new Promise((resolve) => {
      const child = spawn('which', ['codex'], { shell: true });
      child.on('close', (code) => resolve(code === 0));
      child.on('error', () => resolve(false));
    });
  }

  getModels(): string[] {
    return [
      CODEX_MODELS.O4_MINI,
      CODEX_MODELS.O3,
      CODEX_MODELS.GPT4_1,
    ];
  }

  supportsFileRefs(): boolean {
    return false; // Codex reads files directly, doesn't use @ syntax
  }

  getFileRefSyntax(): string {
    return ''; // No file ref syntax
  }

  private buildArgs(config: BackendConfig): string[] {
    const args: string[] = [CODEX_CLI.COMMANDS.EXEC];

    if (config.model) {
      args.push(CODEX_CLI.FLAGS.MODEL, config.model);
    }

    // Approval mode
    if (config.approvalMode) {
      args.push(CODEX_CLI.FLAGS.APPROVAL, config.approvalMode);
    } else if (config.fullAuto) {
      args.push(CODEX_CLI.FLAGS.FULL_AUTO);
    } else {
      // Default to on-request for safety
      args.push(CODEX_CLI.FLAGS.APPROVAL, CODEX_CLI.APPROVAL_MODES.ON_REQUEST);
    }

    // Sandbox mode
    if (config.sandbox === false) {
      args.push(CODEX_CLI.FLAGS.SANDBOX, CODEX_CLI.SANDBOX_MODES.FULL_ACCESS);
    } else {
      args.push(CODEX_CLI.FLAGS.SANDBOX, CODEX_CLI.SANDBOX_MODES.WORKSPACE_WRITE);
    }

    // Read prompt from stdin
    args.push(CODEX_CLI.FLAGS.STDIN);

    return args;
  }

  /**
   * Translate @file references to inline content
   * Codex doesn't support @ syntax, so we read files and include their content
   * Handles paths with dots, slashes, dashes, underscores, and relative paths like @../src/file.ts
   */
  private translateFileRefs(prompt: string, cwd?: string): string {
    const workingDir = cwd || process.cwd();
    // Match @file references - handles:
    // - Relative paths: @../src/file.ts, @./file.ts
    // - Absolute paths: @/home/user/file.ts
    // - Paths with special chars: @src/file-name.test.ts
    // Stops at whitespace or another @ symbol
    const fileRefs = prompt.match(/@(?:\.\.?\/)?[^\s@]+/g) || [];

    if (fileRefs.length === 0) {
      return prompt;
    }

    let translated = prompt;
    const missingFiles: string[] = [];

    for (const ref of fileRefs) {
      const filePath = ref.substring(1); // Remove @ prefix
      const absolutePath = path.isAbsolute(filePath)
        ? filePath
        : path.join(workingDir, filePath);

      try {
        if (fs.existsSync(absolutePath)) {
          const stat = fs.statSync(absolutePath);

          if (stat.isDirectory()) {
            // For directories, list files but don't inline all content
            const files = fs.readdirSync(absolutePath);
            translated = translated.replace(
              ref,
              `\n--- Directory: ${filePath} ---\nFiles: ${files.join(', ')}\n--- end directory ---\n`
            );
          } else {
            const content = fs.readFileSync(absolutePath, 'utf-8');
            translated = translated.replace(
              ref,
              `\n--- File: ${filePath} ---\n${content}\n--- end file: ${filePath} ---\n`
            );
          }
        } else {
          missingFiles.push(filePath);
          Logger.warn(`File not found for @reference: ${filePath}`);
          translated = translated.replace(ref, `[File not found: ${filePath}]`);
        }
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        Logger.error(`Error reading file ${filePath}: ${errMsg}`);
        translated = translated.replace(ref, `[Error reading file: ${filePath}]`);
      }
    }

    // Log warning if files were missing
    if (missingFiles.length > 0) {
      Logger.warn(`Missing file references: ${missingFiles.join(', ')}`);
    }

    return translated;
  }

  private applyChangeModeInstructions(prompt: string): string {
    return `
[CHANGEMODE INSTRUCTIONS]
You are generating code modifications. Output changes in a structured format that can be applied programmatically.

OUTPUT FORMAT (follow exactly):
**FILE: [filename]:[line_number]**
\`\`\`
OLD:
[exact code to be replaced]
NEW:
[new code to insert]
\`\`\`

REQUIREMENTS:
1. The OLD section must match the file content EXACTLY
2. Include enough context to make the match unique
3. Provide complete, functional replacement code

USER REQUEST:
${prompt}
`;
  }

  private executeCommand(
    args: string[],
    prompt: string,
    onProgress?: (output: string) => void,
    cwd?: string
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      Logger.commandExecution('codex', args, startTime);

      const childProcess = spawn('codex', args, {
        env: process.env,
        shell: false,
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: cwd || process.cwd(),
      });

      // Write prompt to stdin
      childProcess.stdin.write(prompt);
      childProcess.stdin.end();

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
      });

      childProcess.on('error', (error) => {
        if (!isResolved) {
          isResolved = true;
          Logger.error('Process error:', error);
          reject(new Error(`Failed to spawn codex command: ${error.message}`));
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
            Logger.error(`Codex failed with exit code ${code}`);
            const errorMessage = stderr.trim() || 'Unknown error';
            reject(new Error(`Codex command failed with exit code ${code}: ${errorMessage}`));
          }
        }
      });
    });
  }
}
