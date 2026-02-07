import * as fs from 'fs/promises';
import { existsSync, constants as fsConstants } from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Logger } from './logger.js';
import { SESSION } from '../constants.js';
/**
 * Default session configuration for all tools
 */
const DEFAULT_SESSION_CONFIG = {
    ttl: SESSION.DEFAULT_TTL,
    maxSessions: SESSION.DEFAULT_MAX_SESSIONS,
    evictionPolicy: SESSION.DEFAULT_EVICTION_POLICY
};
// Base session storage directory (primary + legacy for backwards compatibility)
const PRIMARY_BASE_SESSIONS_DIR = path.join(os.homedir(), SESSION.BASE_DIR);
const LEGACY_BASE_SESSIONS_DIR = path.join(os.homedir(), '.gemini-mcp', 'sessions');
/**
 * Generic session manager for all MCP tools
 * Type parameter T ensures type safety for tool-specific session data
 *
 * @example
 * ```typescript
 * const manager = new SessionManager<MySessionData>('my-tool');
 * manager.save('session-1', { sessionId: 'session-1', ... });
 * const session = manager.load('session-1');
 * ```
 */
export class SessionManager {
    config;
    cacheDir;
    initPromise = null;
    constructor(toolName, customConfig) {
        const toolConfig = SESSION.TOOL_CONFIGS[toolName];
        this.config = {
            toolName,
            ttl: customConfig?.ttl ?? toolConfig?.TTL ?? DEFAULT_SESSION_CONFIG.ttl,
            maxSessions: customConfig?.maxSessions ?? toolConfig?.MAX_SESSIONS ?? DEFAULT_SESSION_CONFIG.maxSessions,
            evictionPolicy: customConfig?.evictionPolicy ?? toolConfig?.EVICTION_POLICY ?? DEFAULT_SESSION_CONFIG.evictionPolicy
        };
        this.cacheDir = path.join(PRIMARY_BASE_SESSIONS_DIR, toolName);
    }
    /**
     * Ensures the tool's session directory exists (lazy initialization)
     */
    async ensureCacheDirAsync() {
        if (this.initPromise)
            return this.initPromise;
        this.initPromise = (async () => {
            try {
                if (!existsSync(this.cacheDir)) {
                    await fs.mkdir(this.cacheDir, { recursive: true });
                    Logger.debug(`[${this.config.toolName}] Created session directory: ${this.cacheDir}`);
                }
            }
            catch (error) {
                Logger.error(`[${this.config.toolName}] Failed to create session directory ${this.cacheDir}: ${error}`);
                throw new Error(`Session directory initialization failed: ${error}`);
            }
        })();
        return this.initPromise;
    }
    /**
     * Helper method to quickly get session count without parsing files
     */
    async getSessionCountFast() {
        try {
            const files = await fs.readdir(this.cacheDir);
            return files.filter(f => f.endsWith('.json')).length;
        }
        catch {
            return 0;
        }
    }
    /**
     * Helper method to read and parse a session file
     */
    async readSessionFile(filePath) {
        try {
            const fileContent = await fs.readFile(filePath, 'utf-8');
            return JSON.parse(fileContent);
        }
        catch (error) {
            throw new Error(`Failed to read session file: ${error}`);
        }
    }
    /**
     * Saves a session to persistent storage
     * @param sessionId User-provided or generated session ID
     * @param data Tool-specific session data
     */
    async save(sessionId, data) {
        await this.ensureCacheDirAsync();
        // Moderate cleanup: only at 80% threshold
        const sessionCount = await this.getSessionCountFast();
        if (sessionCount >= this.config.maxSessions * 0.8) {
            await this.cleanExpiredSessions();
        }
        const filePath = this.getSessionFilePath(sessionId);
        // Ensure createdAt is always set (Issue #4)
        const now = Date.now();
        const cacheEntry = {
            data: {
                ...data,
                sessionId,
                createdAt: data.createdAt || now, // Fallback if not set
                lastAccessedAt: now
            },
            timestamp: now,
            expiryTime: now + this.config.ttl
        };
        try {
            await fs.writeFile(filePath, JSON.stringify(cacheEntry, null, 2), 'utf-8');
            Logger.debug(`[${this.config.toolName}] Saved session: ${sessionId}`);
        }
        catch (error) {
            Logger.error(`[${this.config.toolName}] Failed to save session ${sessionId}: ${error}`);
            throw new Error(`Failed to save session ${sessionId}: ${error}`);
        }
        // Only enforce limits if over max
        if (sessionCount >= this.config.maxSessions) {
            await this.enforceSessionLimits();
        }
    }
    /**
     * Loads a session from storage
     * @param sessionId The session ID to load
     * @returns Session data or null if not found/expired
     */
    async load(sessionId) {
        await this.ensureCacheDirAsync();
        const safeSessionId = this.getSafeSessionId(sessionId);
        const filePath = path.join(this.cacheDir, `${safeSessionId}.json`);
        const legacyFilePath = path.join(LEGACY_BASE_SESSIONS_DIR, this.config.toolName, `${safeSessionId}.json`);
        try {
            // Check if file exists asynchronously (primary first, then legacy)
            let activeFilePath = filePath;
            try {
                await fs.access(activeFilePath, fsConstants.F_OK);
            }
            catch {
                try {
                    await fs.access(legacyFilePath, fsConstants.F_OK);
                    activeFilePath = legacyFilePath;
                }
                catch {
                    Logger.debug(`[${this.config.toolName}] Session not found: ${sessionId}`);
                    return null;
                }
            }
            const cacheEntry = await this.readSessionFile(activeFilePath);
            // Check expiry
            if (Date.now() > cacheEntry.expiryTime) {
                await fs.unlink(activeFilePath);
                Logger.debug(`[${this.config.toolName}] Session expired and deleted: ${sessionId}`);
                // Moderate optimization: run cleanup when we find expired sessions
                await this.cleanExpiredSessions();
                return null;
            }
            // Update last accessed time for LRU
            if (this.config.evictionPolicy === 'lru') {
                cacheEntry.data.lastAccessedAt = Date.now();
                cacheEntry.timestamp = Date.now();
                await fs.writeFile(activeFilePath, JSON.stringify(cacheEntry, null, 2), 'utf-8');
            }
            // Migrate legacy sessions to the primary cache dir on successful load
            if (activeFilePath === legacyFilePath) {
                try {
                    const primaryPath = path.join(this.cacheDir, `${safeSessionId}.json`);
                    await fs.writeFile(primaryPath, JSON.stringify(cacheEntry, null, 2), 'utf-8');
                    await fs.unlink(legacyFilePath).catch(() => undefined);
                    Logger.debug(`[${this.config.toolName}] Migrated legacy session: ${sessionId}`);
                }
                catch (migrationError) {
                    Logger.debug(`[${this.config.toolName}] Failed to migrate legacy session ${sessionId}: ${migrationError}`);
                }
            }
            Logger.debug(`[${this.config.toolName}] Loaded session: ${sessionId}`);
            return cacheEntry.data;
        }
        catch (error) {
            Logger.warn(`[${this.config.toolName}] Failed to load session ${sessionId}: ${error}`);
            // Issue #13: Only delete if file exists and is corrupt (not transient errors)
            try {
                await fs.access(filePath, fsConstants.F_OK);
                // File exists, try to delete it
                try {
                    await fs.unlink(filePath);
                    Logger.debug(`[${this.config.toolName}] Removed corrupt session file: ${sessionId}`);
                }
                catch (unlinkError) {
                    Logger.debug(`[${this.config.toolName}] Could not remove corrupt file ${sessionId}: ${unlinkError}`);
                }
            }
            catch {
                // File doesn't exist, nothing to clean up
            }
            return null;
        }
    }
    /**
     * Lists all active sessions for this tool
     * @returns Array of session data
     */
    async list() {
        await this.ensureCacheDirAsync();
        const sessions = [];
        const now = Date.now();
        try {
            const files = await fs.readdir(this.cacheDir);
            for (const file of files) {
                if (!file.endsWith('.json'))
                    continue;
                const filePath = path.join(this.cacheDir, file);
                try {
                    const cacheEntry = await this.readSessionFile(filePath);
                    // Skip expired sessions
                    if (now <= cacheEntry.expiryTime) {
                        sessions.push(cacheEntry.data);
                    }
                }
                catch (error) {
                    Logger.debug(`[${this.config.toolName}] Error reading session file ${file}: ${error}`);
                }
            }
        }
        catch (error) {
            Logger.error(`[${this.config.toolName}] Failed to list sessions: ${error}`);
        }
        return sessions;
    }
    /**
     * Deletes a specific session
     * @param sessionId The session ID to delete
     * @returns true if deleted, false if not found
     */
    async delete(sessionId) {
        const filePath = this.getSessionFilePath(sessionId);
        try {
            await fs.unlink(filePath);
            Logger.debug(`[${this.config.toolName}] Deleted session: ${sessionId}`);
            return true;
        }
        catch (error) {
            if (error.code === 'ENOENT') {
                Logger.debug(`[${this.config.toolName}] Session not found for deletion: ${sessionId}`);
                return false; // File doesn't exist, effectively "deleted"
            }
            Logger.error(`[${this.config.toolName}] Failed to delete session ${sessionId}: ${error}`);
            return false;
        }
    }
    /**
     * Cleans up expired sessions
     */
    async cleanExpiredSessions() {
        try {
            await this.ensureCacheDirAsync();
            const files = await fs.readdir(this.cacheDir);
            const now = Date.now();
            let cleaned = 0;
            for (const file of files) {
                if (!file.endsWith('.json'))
                    continue;
                const filePath = path.join(this.cacheDir, file);
                try {
                    const cacheEntry = await this.readSessionFile(filePath);
                    if (now > cacheEntry.expiryTime) {
                        await fs.unlink(filePath);
                        cleaned++;
                    }
                }
                catch (error) {
                    // Issue #3: Log errors instead of empty catch
                    Logger.debug(`[${this.config.toolName}] Error checking session file ${file}: ${error}`);
                    // Try to remove corrupt file
                    try {
                        await fs.unlink(filePath);
                        cleaned++;
                    }
                    catch (unlinkError) {
                        Logger.debug(`[${this.config.toolName}] Could not remove corrupt file ${file}: ${unlinkError}`);
                    }
                }
            }
            if (cleaned > 0) {
                Logger.debug(`[${this.config.toolName}] Cleaned ${cleaned} expired sessions`);
            }
        }
        catch (error) {
            Logger.debug(`[${this.config.toolName}] Session cleanup error: ${error}`);
        }
    }
    /**
     * Enforces maximum session limits using configured eviction policy
     */
    async enforceSessionLimits() {
        try {
            const files = await fs.readdir(this.cacheDir);
            const jsonFiles = files.filter(f => f.endsWith('.json'));
            if (jsonFiles.length <= this.config.maxSessions) {
                return;
            }
            // Get file stats for sorting
            const fileStats = await Promise.all(jsonFiles.map(async (name) => {
                const filePath = path.join(this.cacheDir, name);
                const stat = await fs.stat(filePath);
                return { name, path: filePath, stat };
            }));
            // Sort based on eviction policy
            if (this.config.evictionPolicy === 'fifo') {
                // Sort by creation time (oldest first)
                fileStats.sort((a, b) => a.stat.birthtimeMs - b.stat.birthtimeMs);
            }
            else {
                // LRU: Sort by modification time (least recently accessed first)
                fileStats.sort((a, b) => a.stat.mtimeMs - b.stat.mtimeMs);
            }
            // Remove oldest files
            const toRemove = fileStats.slice(0, fileStats.length - this.config.maxSessions);
            let removed = 0;
            for (const file of toRemove) {
                try {
                    await fs.unlink(file.path);
                    removed++;
                }
                catch (error) {
                    // Issue #3: Log instead of empty catch
                    Logger.debug(`[${this.config.toolName}] Failed to remove session file ${file.name}: ${error}`);
                }
            }
            Logger.debug(`[${this.config.toolName}] Removed ${removed}/${toRemove.length} sessions (${this.config.evictionPolicy} policy)`);
        }
        catch (error) {
            Logger.debug(`[${this.config.toolName}] Error enforcing session limits: ${error}`);
        }
    }
    /**
     * Gets the file path for a session
     */
    getSessionFilePath(sessionId) {
        const safeSessionId = this.getSafeSessionId(sessionId);
        return path.join(this.cacheDir, `${safeSessionId}.json`);
    }
    getSafeSessionId(sessionId) {
        // Issue #12: More robust sanitization
        // Replace invalid characters, then clean up consecutive/leading/trailing hyphens
        let safeSessionId = sessionId
            .replace(/[^a-zA-Z0-9-_]/g, '-') // Replace invalid chars
            .replace(/-+/g, '-') // Collapse consecutive hyphens
            .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
        // Ensure we have a valid ID after sanitization
        if (!safeSessionId) {
            safeSessionId = 'session';
        }
        return safeSessionId;
    }
    /**
     * Gets statistics about the session cache
     */
    async getStats() {
        await this.ensureCacheDirAsync();
        let sessionCount = 0;
        try {
            const files = await fs.readdir(this.cacheDir);
            sessionCount = files.filter(f => f.endsWith('.json')).length;
        }
        catch (error) {
            // Issue #9/#14: Log error instead of empty catch
            Logger.debug(`[${this.config.toolName}] Error reading session directory for stats: ${error}`);
        }
        return {
            toolName: this.config.toolName,
            sessionCount,
            ttl: this.config.ttl,
            maxSessions: this.config.maxSessions,
            evictionPolicy: this.config.evictionPolicy,
            cacheDir: this.cacheDir
        };
    }
}
//# sourceMappingURL=sessionManager.js.map