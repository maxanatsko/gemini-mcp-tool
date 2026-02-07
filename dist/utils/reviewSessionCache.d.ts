/**
 * @deprecated This file is deprecated. Session management has been migrated to the shared infrastructure.
 *
 * - For session operations, use: src/utils/reviewSessionManager.ts
 * - For type definitions, use: src/utils/sessionSchemas.ts
 *
 * This file is kept only for backward compatibility and type exports (ReviewComment, ReviewRound).
 * The actual session cache functions (save/load/create) have been moved to reviewSessionManager.ts
 */
import { GitState } from './gitStateDetector.js';
export interface ReviewComment {
    id: string;
    filePattern: string;
    lineRange?: {
        start: number;
        end: number;
    };
    severity: 'critical' | 'important' | 'suggestion' | 'question';
    comment: string;
    roundGenerated: number;
    status: 'pending' | 'accepted' | 'rejected' | 'modified' | 'deferred';
    resolution?: string;
}
export interface ReviewRound {
    roundNumber: number;
    timestamp: number;
    filesReviewed: string[];
    userPrompt: string;
    response: string;
    commentsGenerated: ReviewComment[];
    gitState: GitState;
}
export interface CodeReviewSession {
    sessionId: string;
    createdAt: number;
    lastAccessedAt: number;
    gitState: GitState;
    currentGitState: GitState;
    rounds: ReviewRound[];
    allComments: ReviewComment[];
    filesTracked: string[];
    focusFiles?: string[];
    reviewScope?: 'full' | 'changes-only' | 'focused';
    totalRounds: number;
    sessionState: 'active' | 'paused' | 'completed';
}
/**
 * Saves a review session to the cache
 * @param session The session to save
 */
export declare function saveReviewSession(session: CodeReviewSession): void;
/**
 * Loads a review session from the cache
 * @param sessionId The session ID to load
 * @returns The session or null if not found/expired
 */
export declare function loadReviewSession(sessionId: string): CodeReviewSession | null;
/**
 * Lists all active review sessions
 * @returns Array of active sessions
 */
export declare function listActiveSessions(): CodeReviewSession[];
/**
 * Creates a new review session
 * @param sessionId The session ID
 * @param gitState The initial git state
 * @param focusFiles Optional files to focus on
 * @returns New CodeReviewSession object
 */
export declare function createNewSession(sessionId: string, gitState: GitState, focusFiles?: string[]): CodeReviewSession;
/**
 * Gets cache statistics
 * @returns Cache stats object
 */
export declare function getReviewCacheStats(): {
    size: number;
    ttl: number;
    maxSize: number;
    cacheDir: string;
};
//# sourceMappingURL=reviewSessionCache.d.ts.map