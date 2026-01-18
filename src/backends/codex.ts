/**
 * Codex Backend - Executes prompts via OpenAI's Codex CLI
 *
 * Uses `codex exec` for non-interactive execution mode.
 * Supports native session resume via thread_id from JSON output.
 * Codex CLI does not support @file syntax, so files must be read and inlined.
 */

import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { BackendExecutor, BackendConfig, BackendType, BackendResult } from './types.js';
import { Logger } from '../utils/logger.js';
import { CODEX_CLI, CODEX_MODELS } from '../constants.js';

/** Parsed result from Codex JSON output */
interface CodexJsonResult {
  response: string;
  threadId?: string;
}

export class CodexBackend implements BackendExecutor {
  name: BackendType = 'codex';

  async execute(
    prompt: string,
    config: BackendConfig,
    onProgress?: (output: string) => void
  ): Promise<BackendResult> {
    // Translate @file references to inline content since Codex doesn't support them
    const processedPrompt = this.translateFileRefs(prompt, config.cwd);

    // Apply changeMode instructions if enabled
    const finalPrompt = config.changeMode
      ? this.applyChangeModeInstructions(processedPrompt)
      : processedPrompt;

    // Build args - use resume if we have an existing threadId
    const args = this.buildArgs(config);

    // Execute and parse JSON output
    const result = await this.executeCommand(args, finalPrompt, onProgress, config.cwd);

    return {
      response: result.response,
      backend: this.name,
      model: config.model,
      codexThreadId: result.threadId,
    };
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
      CODEX_MODELS.GPT_5_2_CODEX,
      CODEX_MODELS.GPT_5_1_CODEX_MINI,
      CODEX_MODELS.GPT_5_1_CODEX_MAX,
      CODEX_MODELS.GPT_5_2,
      CODEX_MODELS.GPT_5_1,
    ];
  }

  supportsFileRefs(): boolean {
    return false; // Codex reads files directly, doesn't use @ syntax
  }

  getFileRefSyntax(): string {
    return ''; // No file ref syntax
  }

  private buildArgs(config: BackendConfig): string[] {
    const args: string[] = [];

    // Use resume command if we have an existing thread ID
    // `codex resume <threadId>` is a separate top-level command, not a subcommand of exec
    if (config.codexThreadId) {
      args.push(CODEX_CLI.COMMANDS.RESUME, config.codexThreadId);
    } else {
      args.push(CODEX_CLI.COMMANDS.EXEC);
    }

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

    // Reasoning effort (defaults to medium if not specified)
    if (config.reasoningEffort) {
      args.push(CODEX_CLI.FLAGS.REASONING_EFFORT, config.reasoningEffort);
    }

    // Enable JSON output to capture thread_id
    args.push(CODEX_CLI.FLAGS.JSON);

    // Read prompt from stdin
    args.push(CODEX_CLI.FLAGS.STDIN);

    return args;
  }

  /**
   * Validate that a resolved path is within the allowed workspace
   * Prevents path traversal attacks
   */
  private isPathWithinWorkspace(resolvedPath: string, workingDir: string): boolean {
    // Normalize both paths to handle any .. or . components
    const normalizedPath = path.normalize(resolvedPath);
    const normalizedWorkDir = path.normalize(workingDir);

    // Check if the resolved path starts with the working directory
    return normalizedPath.startsWith(normalizedWorkDir + path.sep) ||
           normalizedPath === normalizedWorkDir;
  }

  /**
   * Translate @file references to inline content
   * Codex doesn't support @ syntax, so we read files and include their content
   * Handles paths with dots, slashes, dashes, underscores, and relative paths like @../src/file.ts
   * Includes path traversal protection to prevent reading files outside workspace
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
    const deniedFiles: string[] = [];

    // Max file size: 10MB to prevent memory exhaustion
    const MAX_FILE_SIZE = 10 * 1024 * 1024;

    for (const ref of fileRefs) {
      const filePath = ref.substring(1); // Remove @ prefix
      const absolutePath = path.isAbsolute(filePath)
        ? filePath
        : path.join(workingDir, filePath);

      // Resolve to get the real path (follows symlinks and resolves . and ..)
      let resolvedPath: string;
      try {
        resolvedPath = fs.realpathSync(absolutePath);
      } catch {
        // File doesn't exist, will be handled below
        resolvedPath = path.resolve(absolutePath);
      }

      // Security check: Ensure path is within workspace
      if (!this.isPathWithinWorkspace(resolvedPath, workingDir)) {
        deniedFiles.push(filePath);
        Logger.warn(`Path traversal blocked for @reference: ${filePath} (resolved to ${resolvedPath})`);
        translated = translated.replace(ref, `[Access denied: ${filePath} is outside workspace]`);
        continue;
      }

      try {
        if (fs.existsSync(absolutePath)) {
          const stat = fs.statSync(absolutePath);

          // Check for symlinks pointing outside workspace
          if (stat.isSymbolicLink && stat.isSymbolicLink()) {
            const realPath = fs.realpathSync(absolutePath);
            if (!this.isPathWithinWorkspace(realPath, workingDir)) {
              deniedFiles.push(filePath);
              Logger.warn(`Symlink traversal blocked for @reference: ${filePath}`);
              translated = translated.replace(ref, `[Access denied: symlink points outside workspace]`);
              continue;
            }
          }

          if (stat.isDirectory()) {
            // For directories, list files but don't inline all content
            const files = fs.readdirSync(absolutePath);
            translated = translated.replace(
              ref,
              `\n--- Directory: ${filePath} ---\nFiles: ${files.join(', ')}\n--- end directory ---\n`
            );
          } else {
            // Check file size before reading
            if (stat.size > MAX_FILE_SIZE) {
              Logger.warn(`File too large for @reference: ${filePath} (${(stat.size / 1024 / 1024).toFixed(2)}MB > 10MB limit)`);
              translated = translated.replace(ref, `[File too large: ${filePath} (${(stat.size / 1024 / 1024).toFixed(2)}MB exceeds 10MB limit)]`);
              continue;
            }

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

    // Log warnings for security and missing files
    if (deniedFiles.length > 0) {
      Logger.warn(`Security: Blocked access to ${deniedFiles.length} file(s) outside workspace`);
    }
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

  /**
   * Parse JSONL output from Codex CLI
   * Extracts thread_id from thread.started event and response text from message events
   */
  private parseJsonOutput(jsonlOutput: string): CodexJsonResult {
    const lines = jsonlOutput.trim().split('\n');
    let threadId: string | undefined;
    const responseChunks: string[] = [];

    for (const line of lines) {
      if (!line.trim()) continue;

      try {
        const event = JSON.parse(line);

        // Extract thread_id from thread.started event
        if (event.type === 'thread.started' && event.thread_id) {
          threadId = event.thread_id;
          Logger.debug(`Codex thread started: ${threadId}`);
        }

        // Extract response text from various event types
        // Agent messages contain the actual response
        if (event.type === 'item.agent_message' && event.content) {
          responseChunks.push(event.content);
        }

        // Also check for message content in turn.completed
        if (event.type === 'turn.completed' && event.output) {
          if (typeof event.output === 'string') {
            responseChunks.push(event.output);
          } else if (event.output.content) {
            responseChunks.push(event.output.content);
          }
        }

        // Handle item.message for direct message content
        if (event.type === 'item.message' && event.content) {
          if (Array.isArray(event.content)) {
            for (const part of event.content) {
              if (part.type === 'text' && part.text) {
                responseChunks.push(part.text);
              }
            }
          } else if (typeof event.content === 'string') {
            responseChunks.push(event.content);
          }
        }

      } catch (parseError) {
        // Not all lines may be valid JSON, skip them
        Logger.debug(`Skipping non-JSON line: ${line.substring(0, 50)}...`);
      }
    }

    // Join all response chunks
    const response = responseChunks.join('\n').trim();

    // If no response extracted from events, use raw output minus JSON structure
    if (!response) {
      Logger.warn('No structured response found in Codex JSON output, using raw text extraction');
      // Try to extract any text content from the raw output
      const textMatch = jsonlOutput.match(/"text"\s*:\s*"([^"]+)"/g);
      if (textMatch) {
        const extractedTexts = textMatch.map(m => {
          const match = m.match(/"text"\s*:\s*"([^"]+)"/);
          return match ? match[1] : '';
        }).filter(Boolean);
        return { response: extractedTexts.join('\n'), threadId };
      }
      return { response: jsonlOutput, threadId };
    }

    return { response, threadId };
  }

  private executeCommand(
    args: string[],
    prompt: string,
    onProgress?: (output: string) => void,
    cwd?: string
  ): Promise<CodexJsonResult> {
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

      childProcess.stdout.on('data', (data) => {
        stdout += data.toString();

        // For JSON output, try to parse and report progress from events
        if (onProgress) {
          const newLines = data.toString().split('\n');
          for (const line of newLines) {
            if (!line.trim()) continue;
            try {
              const event = JSON.parse(line);
              // Report agent messages as progress
              if (event.type === 'item.agent_message' && event.content) {
                onProgress(event.content);
              }
            } catch {
              // Skip non-JSON lines
            }
          }
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
            // Parse JSON output to extract thread_id and response
            const result = this.parseJsonOutput(stdout);
            resolve(result);
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
