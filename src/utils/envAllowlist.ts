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
export function getAllowedEnv(): Record<string, string | undefined> {
  const allowlist = [
    // Basic shell operation
    'PATH',
    'HOME',
    'LANG',
    'TERM',
    'USER',
    'SHELL',
    // Windows standard directories
    'USERPROFILE',
    'APPDATA',
    'LOCALAPPDATA',
    // Proxy support (critical for corporate environments)
    'HTTP_PROXY',
    'HTTPS_PROXY',
    'NO_PROXY',
    'http_proxy',  // Some tools use lowercase
    'https_proxy',
    'no_proxy',
    // CLI-specific authentication
    'GEMINI_API_KEY',
    'OPENAI_API_KEY',
    // XDG directories (Linux standard)
    'XDG_CONFIG_HOME',
    'XDG_DATA_HOME',
    'XDG_CACHE_HOME',
    // Node.js
    'NODE_ENV',
  ];

  const env: Record<string, string | undefined> = {};
  for (const key of allowlist) {
    if (process.env[key] !== undefined) {
      env[key] = process.env[key];
    }
  }

  return env;
}
