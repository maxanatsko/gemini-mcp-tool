/**
 * Backend Registry - Manages available AI backends
 *
 * Defaults to Gemini. User must explicitly pass 'codex' to use Codex backend.
 */
import { GeminiBackend } from './gemini.js';
import { CodexBackend } from './codex.js';
import { Logger } from '../utils/logger.js';
// Initialize backends
const geminiBackend = new GeminiBackend();
const codexBackend = new CodexBackend();
const backends = new Map([
    ['gemini', geminiBackend],
    ['codex', codexBackend],
]);
/**
 * Get the requested backend. Defaults to Gemini if not specified.
 * User must explicitly choose 'codex' to use Codex backend.
 *
 * @param preference The backend to use ('gemini' or 'codex'). Defaults to 'gemini'.
 * @returns The backend executor instance
 * @throws Error if the requested backend is not available
 */
export async function getBackend(preference) {
    const backendName = preference || 'gemini'; // Default to Gemini
    const backend = backends.get(backendName);
    if (!backend) {
        throw new Error(`Unknown backend: '${backendName}'. Available backends: gemini, codex`);
    }
    const isAvailable = await backend.isAvailable();
    if (!isAvailable) {
        throw new Error(`Backend '${backendName}' is not available. ` +
            `Please install the ${backendName} CLI first.\n` +
            (backendName === 'gemini'
                ? 'Install Gemini CLI: https://github.com/google-gemini/gemini-cli'
                : 'Install Codex CLI: npm install -g @openai/codex'));
    }
    Logger.debug(`Using backend: ${backendName}`);
    return backend;
}
/**
 * Get a backend without checking availability.
 * Use this when you just need the backend instance for metadata.
 */
export function getBackendSync(preference) {
    const backendName = preference || 'gemini';
    const backend = backends.get(backendName);
    if (!backend) {
        throw new Error(`Unknown backend: '${backendName}'`);
    }
    return backend;
}
/**
 * Check if a specific backend is available
 */
export async function isBackendAvailable(backendName) {
    const backend = backends.get(backendName);
    if (!backend)
        return false;
    return backend.isAvailable();
}
/**
 * Get all registered backends
 */
export function getAllBackends() {
    return Array.from(backends.values());
}
/**
 * Get all available backends (async check)
 */
export async function getAvailableBackends() {
    const available = [];
    for (const backend of backends.values()) {
        if (await backend.isAvailable()) {
            available.push(backend);
        }
    }
    return available;
}
//# sourceMappingURL=registry.js.map