/**
 * Backend abstraction layer types for dual-backend support (Gemini + Codex)
 */

export type BackendType = 'gemini' | 'codex';

export interface BackendConfig {
  provider: BackendType;
  model?: string;
  sandbox?: boolean;
  /**
   * Sandbox mode for backends that support granular policies (Codex).
   * If not provided, the backend chooses a safe default.
   */
  sandboxMode?: 'read-only' | 'workspace-write' | 'danger-full-access';
  changeMode?: boolean;
  allowedTools?: string[];
  cwd?: string;
  // Codex-specific options
  approvalMode?: 'untrusted' | 'on-failure' | 'on-request' | 'never';
  fullAuto?: boolean;
  // Codex native session resume - if provided, uses `codex exec resume <threadId>`
  codexThreadId?: string;
  // Reasoning effort level (Codex only): low, medium (default), high, xhigh
  reasoningEffort?: 'low' | 'medium' | 'high' | 'xhigh';
}

export interface BackendExecutor {
  /** Backend identifier */
  name: BackendType;

  /**
   * Execute a prompt using this backend
   * @param prompt The prompt to send to the AI
   * @param config Backend configuration options
   * @param onProgress Optional callback for streaming progress
   * @returns The execution result with response and optional metadata
   */
  execute(
    prompt: string,
    config: BackendConfig,
    onProgress?: (output: string) => void
  ): Promise<BackendResult>;

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
  /** The AI's response text */
  response: string;
  /** Which backend processed the request */
  backend: BackendType;
  /** Model used (if specified) */
  model?: string;
  /** Codex thread ID for native session resume (only set by Codex backend) */
  codexThreadId?: string;
}
