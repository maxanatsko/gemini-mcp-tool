/**
 * Backends module - Dual-backend support for Gemini and Codex CLI
 */
// Implementations
export { GeminiBackend } from './gemini.js';
export { CodexBackend } from './codex.js';
// Registry
export { getBackend, getBackendSync, isBackendAvailable, getAllBackends, getAvailableBackends } from './registry.js';
//# sourceMappingURL=index.js.map