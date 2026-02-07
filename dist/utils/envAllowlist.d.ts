/**
 * Environment Variable Allowlist
 *
 * Only pass a curated set of environment variables to spawned processes.
 * This prevents leaking sensitive credentials and improves security.
 */
/**
 * Returns an allowlisted subset of environment variables for spawned processes.
 *
 * Includes:
 * - PATH, HOME, LANG, TERM - Basic shell operation
 * - HTTP_PROXY, HTTPS_PROXY, NO_PROXY, http_proxy, https_proxy, no_proxy - Corporate proxy support
 * - GEMINI_API_KEY, OPENAI_API_KEY - CLI-specific auth
 * - XDG_* - Linux standard directories
 */
export declare function getAllowedEnv(): Record<string, string | undefined>;
//# sourceMappingURL=envAllowlist.d.ts.map