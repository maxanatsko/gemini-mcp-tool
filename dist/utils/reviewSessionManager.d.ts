import { ReviewCodeSessionData } from './sessionSchemas.js';
import { GitState } from './gitStateDetector.js';
/**
 * Specialized session manager for review-code tool
 * Wraps generic SessionManager with review-specific helpers
 * Maintains backward compatibility with reviewSessionCache.ts
 */
export declare class ReviewSessionManager {
    private sessionManager;
    constructor();
    /**
     * Saves a review session (maintains existing interface)
     */
    saveReviewSession(session: ReviewCodeSessionData): Promise<void>;
    /**
     * Loads a review session (maintains existing interface)
     */
    loadReviewSession(sessionId: string): Promise<ReviewCodeSessionData | null>;
    /**
     * Lists active review sessions
     */
    listActiveSessions(): Promise<ReviewCodeSessionData[]>;
    /**
     * Creates a new review session
     */
    createNewSession(sessionId: string, gitState: GitState, focusFiles?: string[]): ReviewCodeSessionData;
    /**
     * Gets cache statistics
     */
    getReviewCacheStats(): Promise<{
        toolName: string;
        sessionCount: number;
        ttl: number;
        maxSessions: number;
        evictionPolicy: string;
        cacheDir: string;
    }>;
}
export declare const reviewSessionManager: ReviewSessionManager;
export declare const saveReviewSession: (session: ReviewCodeSessionData) => Promise<void>;
export declare const loadReviewSession: (sessionId: string) => Promise<ReviewCodeSessionData | null>;
export declare const listActiveSessions: () => Promise<ReviewCodeSessionData[]>;
export declare const createNewSession: (sessionId: string, gitState: GitState, focusFiles?: string[]) => ReviewCodeSessionData;
export declare const getReviewCacheStats: () => Promise<{
    toolName: string;
    sessionCount: number;
    ttl: number;
    maxSessions: number;
    evictionPolicy: string;
    cacheDir: string;
}>;
//# sourceMappingURL=reviewSessionManager.d.ts.map