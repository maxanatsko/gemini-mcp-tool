/**
 * Codex Backend - Executes prompts via OpenAI's Codex CLI
 *
 * Uses `codex exec` for non-interactive execution mode.
 * Supports native session resume via thread_id from JSON output.
 * Codex CLI does not support @file syntax, so files must be read and inlined.
 */
import { BackendExecutor, BackendConfig, BackendType, BackendResult } from './types.js';
export declare class CodexBackend implements BackendExecutor {
    name: BackendType;
    execute(prompt: string, config: BackendConfig, onProgress?: (output: string) => void): Promise<BackendResult>;
    isAvailable(): Promise<boolean>;
    getModels(): string[];
    supportsFileRefs(): boolean;
    getFileRefSyntax(): string;
    private buildArgs;
    /**
     * Validate that a resolved path is within the allowed workspace
     * Prevents path traversal attacks including Windows drive letter escapes
     */
    private isPathWithinWorkspace;
    /**
     * Translate @file references to inline content
     * Codex doesn't support @ syntax, so we read files and include their content
     * Handles paths with dots, slashes, dashes, underscores, and relative paths like @../src/file.ts
     * Includes path traversal protection to prevent reading files outside workspace
     */
    private translateFileRefs;
    private applyChangeModeInstructions;
    /**
     * Parse JSONL output from Codex CLI
     * Extracts thread_id from thread.started event and response text from message events
     */
    private parseJsonOutput;
    private executeCommand;
}
//# sourceMappingURL=codex.d.ts.map