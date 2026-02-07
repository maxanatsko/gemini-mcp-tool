/**
 * Base interface that all tool-specific session data must extend
 * Ensures every session has core metadata fields
 */
export interface SessionData {
    sessionId: string;
    createdAt: number;
    lastAccessedAt: number;
}
/**
 * Configuration for a tool's session management
 */
export interface SessionConfig {
    toolName: string;
    ttl: number;
    maxSessions: number;
    evictionPolicy: 'fifo' | 'lru';
}
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
export declare class SessionManager<T extends SessionData> {
    private config;
    private cacheDir;
    private initPromise;
    constructor(toolName: string, customConfig?: Partial<SessionConfig>);
    /**
     * Ensures the tool's session directory exists (lazy initialization)
     */
    private ensureCacheDirAsync;
    /**
     * Helper method to quickly get session count without parsing files
     */
    private getSessionCountFast;
    /**
     * Helper method to read and parse a session file
     */
    private readSessionFile;
    /**
     * Saves a session to persistent storage
     * @param sessionId User-provided or generated session ID
     * @param data Tool-specific session data
     */
    save(sessionId: string, data: T): Promise<void>;
    /**
     * Loads a session from storage
     * @param sessionId The session ID to load
     * @returns Session data or null if not found/expired
     */
    load(sessionId: string): Promise<T | null>;
    /**
     * Lists all active sessions for this tool
     * @returns Array of session data
     */
    list(): Promise<T[]>;
    /**
     * Deletes a specific session
     * @param sessionId The session ID to delete
     * @returns true if deleted, false if not found
     */
    delete(sessionId: string): Promise<boolean>;
    /**
     * Cleans up expired sessions
     */
    private cleanExpiredSessions;
    /**
     * Enforces maximum session limits using configured eviction policy
     */
    private enforceSessionLimits;
    /**
     * Gets the file path for a session
     */
    private getSessionFilePath;
    private getSafeSessionId;
    /**
     * Gets statistics about the session cache
     */
    getStats(): Promise<{
        toolName: string;
        sessionCount: number;
        ttl: number;
        maxSessions: number;
        evictionPolicy: string;
        cacheDir: string;
    }>;
}
//# sourceMappingURL=sessionManager.d.ts.map