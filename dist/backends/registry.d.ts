/**
 * Backend Registry - Manages available AI backends
 *
 * Defaults to Gemini. User must explicitly pass 'codex' to use Codex backend.
 */
import { BackendExecutor, BackendType } from './types.js';
/**
 * Get the requested backend. Defaults to Gemini if not specified.
 * User must explicitly choose 'codex' to use Codex backend.
 *
 * @param preference The backend to use ('gemini' or 'codex'). Defaults to 'gemini'.
 * @returns The backend executor instance
 * @throws Error if the requested backend is not available
 */
export declare function getBackend(preference?: BackendType): Promise<BackendExecutor>;
/**
 * Get a backend without checking availability.
 * Use this when you just need the backend instance for metadata.
 */
export declare function getBackendSync(preference?: BackendType): BackendExecutor;
/**
 * Check if a specific backend is available
 */
export declare function isBackendAvailable(backendName: BackendType): Promise<boolean>;
/**
 * Get all registered backends
 */
export declare function getAllBackends(): BackendExecutor[];
/**
 * Get all available backends (async check)
 */
export declare function getAvailableBackends(): Promise<BackendExecutor[]>;
//# sourceMappingURL=registry.d.ts.map