import { BrainstormSessionData } from './sessionSchemas.js';
/**
 * Session manager for brainstorm tool
 * Tracks iterative ideation with ideas and feedback
 */
export declare class BrainstormSessionManager {
    private sessionManager;
    constructor();
    /**
     * Creates a new brainstorming session
     */
    createSession(sessionId: string, challenge: string, methodology: string, domain?: string, constraints?: string): BrainstormSessionData;
    /**
     * Adds a brainstorming round with generated ideas
     */
    addRound(session: BrainstormSessionData, userPrompt: string, response: string, ideas: Array<{
        name: string;
        description: string;
        feasibility?: number;
        impact?: number;
        innovation?: number;
    }>, backend?: 'gemini' | 'codex', codexThreadId?: string): BrainstormSessionData;
    /**
     * Records idea refinement action
     */
    refineIdeas(session: BrainstormSessionData, action: 'refined' | 'merged' | 'discarded', ideaIds: string[], reason: string): BrainstormSessionData;
    /**
     * Builds context from previous rounds' ideas
     * @param session The session to build context from
     * @param activeOnly Only include active/refined ideas (exclude discarded/merged)
     * @returns Formatted ideas context
     */
    buildIdeasContext(session: BrainstormSessionData, activeOnly?: boolean): string;
    /**
     * Saves a session
     */
    save(session: BrainstormSessionData): Promise<void>;
    /**
     * Loads a session
     */
    load(sessionId: string): Promise<BrainstormSessionData | null>;
    /**
     * Lists all sessions
     */
    list(): Promise<BrainstormSessionData[]>;
    /**
     * Deletes a session
     */
    delete(sessionId: string): Promise<boolean>;
    /**
     * Gets or creates a session
     */
    getOrCreate(sessionId: string, challenge: string, methodology: string, domain?: string, constraints?: string): Promise<BrainstormSessionData>;
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
export declare const brainstormSessionManager: BrainstormSessionManager;
//# sourceMappingURL=brainstormSessionManager.d.ts.map