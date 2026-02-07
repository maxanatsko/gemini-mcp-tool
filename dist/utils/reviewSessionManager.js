import { SessionManager } from './sessionManager.js';
/**
 * Specialized session manager for review-code tool
 * Wraps generic SessionManager with review-specific helpers
 * Maintains backward compatibility with reviewSessionCache.ts
 */
export class ReviewSessionManager {
    sessionManager;
    constructor() {
        this.sessionManager = new SessionManager('review-code');
    }
    /**
     * Saves a review session (maintains existing interface)
     */
    async saveReviewSession(session) {
        await this.sessionManager.save(session.sessionId, session);
    }
    /**
     * Loads a review session (maintains existing interface)
     */
    async loadReviewSession(sessionId) {
        return await this.sessionManager.load(sessionId);
    }
    /**
     * Lists active review sessions
     */
    async listActiveSessions() {
        return await this.sessionManager.list();
    }
    /**
     * Creates a new review session
     */
    createNewSession(sessionId, gitState, focusFiles) {
        const now = Date.now();
        return {
            sessionId,
            createdAt: now,
            lastAccessedAt: now,
            gitState,
            currentGitState: gitState,
            rounds: [],
            allComments: [],
            filesTracked: [],
            focusFiles,
            reviewScope: focusFiles ? 'focused' : 'full',
            totalRounds: 0,
            sessionState: 'active'
        };
    }
    /**
     * Gets cache statistics
     */
    async getReviewCacheStats() {
        return await this.sessionManager.getStats();
    }
}
// Export singleton instance for backward compatibility
export const reviewSessionManager = new ReviewSessionManager();
// Export existing function signatures for drop-in replacement
export const saveReviewSession = async (session) => await reviewSessionManager.saveReviewSession(session);
export const loadReviewSession = async (sessionId) => await reviewSessionManager.loadReviewSession(sessionId);
export const listActiveSessions = async () => await reviewSessionManager.listActiveSessions();
export const createNewSession = (sessionId, gitState, focusFiles) => reviewSessionManager.createNewSession(sessionId, gitState, focusFiles);
export const getReviewCacheStats = async () => await reviewSessionManager.getReviewCacheStats();
//# sourceMappingURL=reviewSessionManager.js.map