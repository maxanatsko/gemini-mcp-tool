/**
 * Backends module - Dual-backend support for Gemini and Codex CLI
 */
export type { BackendType, BackendConfig, BackendExecutor, BackendResult } from './types.js';
export { GeminiBackend } from './gemini.js';
export { CodexBackend } from './codex.js';
export { getBackend, getBackendSync, isBackendAvailable, getAllBackends, getAvailableBackends } from './registry.js';
//# sourceMappingURL=index.d.ts.map