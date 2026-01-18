/**
 * Backend abstraction layer types for dual-backend support (Gemini + Codex)
 */

export type BackendType = 'gemini' | 'codex';

export interface BackendConfig {
  provider: BackendType;
  model?: string;
  sandbox?: boolean;
  changeMode?: boolean;
  allowedTools?: string[];
  cwd?: string;
  // Codex-specific options
  approvalMode?: 'untrusted' | 'on-failure' | 'on-request' | 'never';
  fullAuto?: boolean;
}

export interface BackendExecutor {
  /** Backend identifier */
  name: BackendType;

  /**
   * Execute a prompt using this backend
   * @param prompt The prompt to send to the AI
   * @param config Backend configuration options
   * @param onProgress Optional callback for streaming progress
   * @returns The AI's response
   */
  execute(
    prompt: string,
    config: BackendConfig,
    onProgress?: (output: string) => void
  ): Promise<string>;

  /**
   * Check if this backend's CLI is available
   * @returns True if the CLI is installed and accessible
   */
  isAvailable(): Promise<boolean>;

  /**
   * Get the list of supported models for this backend
   */
  getModels(): string[];

  /**
   * Whether this backend supports @file reference syntax
   */
  supportsFileRefs(): boolean;

  /**
   * Get the file reference syntax (e.g., '@' for Gemini)
   */
  getFileRefSyntax(): string;
}

export interface BackendResult {
  response: string;
  backend: BackendType;
  model?: string;
}
