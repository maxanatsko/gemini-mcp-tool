import { AskSessionData } from './sessionSchemas.js';
/**
 * Session manager for ask tool
 * Tracks multi-turn conversations with context across backends
 */
export declare class AskSessionManager {
    private sessionManager;
    constructor();
    /**
     * Creates a new conversation session
     */
    createSession(sessionId: string): AskSessionData;
    /**
     * Adds a conversation round to the session
     */
    addRound(session: AskSessionData, userPrompt: string, response: string, model: string, contextFiles?: string[], backend?: 'gemini' | 'codex', codexThreadId?: string): AskSessionData;
    /**
     * Builds conversation context from history for inclusion in prompts
     * @param session The session to build context from
     * @param maxRounds Maximum number of previous rounds to include (default: 3)
     * @returns Formatted conversation context
     */
    buildConversationContext(session: AskSessionData, maxRounds?: number): string;
    /**
     * Saves a session
     */
    save(session: AskSessionData): Promise<void>;
    /**
     * Loads a session
     */
    load(sessionId: string): Promise<AskSessionData | null>;
    /**
     * Lists all sessions
     */
    list(): Promise<AskSessionData[]>;
    /**
     * Deletes a session
     */
    delete(sessionId: string): Promise<boolean>;
    /**
     * Gets or creates a session
     */
    getOrCreate(sessionId: string): Promise<AskSessionData>;
    /**
     * Gets cache statistics
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
export declare const askSessionManager: AskSessionManager;
export declare const AskGeminiSessionManager: typeof AskSessionManager;
export declare const askGeminiSessionManager: AskSessionManager;
//# sourceMappingURL=askSessionManager.d.ts.map