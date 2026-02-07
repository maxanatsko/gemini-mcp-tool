import { SessionManager } from './sessionManager.js';
/**
 * Session manager for ask tool
 * Tracks multi-turn conversations with context across backends
 */
export class AskSessionManager {
    sessionManager;
    constructor() {
        this.sessionManager = new SessionManager('ask');
    }
    /**
     * Creates a new conversation session
     */
    createSession(sessionId) {
        const now = Date.now();
        return {
            sessionId,
            createdAt: now,
            lastAccessedAt: now,
            conversationHistory: [],
            totalRounds: 0,
            contextFiles: [],
            metadata: {}
        };
    }
    /**
     * Adds a conversation round to the session
     */
    addRound(session, userPrompt, response, model, contextFiles, backend, codexThreadId) {
        session.conversationHistory.push({
            roundNumber: session.totalRounds + 1,
            timestamp: Date.now(),
            userPrompt,
            response,
            model,
            backend
        });
        session.totalRounds++;
        session.lastAccessedAt = Date.now();
        // Track context files
        if (contextFiles && contextFiles.length > 0) {
            session.contextFiles = [...new Set([...session.contextFiles, ...contextFiles])];
        }
        // Store Codex thread ID for native session resume
        if (codexThreadId) {
            session.codexThreadId = codexThreadId;
        }
        // Track which backend was used last
        if (backend) {
            session.lastBackend = backend;
        }
        return session;
    }
    /**
     * Builds conversation context from history for inclusion in prompts
     * @param session The session to build context from
     * @param maxRounds Maximum number of previous rounds to include (default: 3)
     * @returns Formatted conversation context
     */
    buildConversationContext(session, maxRounds = 3) {
        if (session.conversationHistory.length === 0) {
            return '';
        }
        const recentRounds = session.conversationHistory.slice(-maxRounds);
        const contextParts = recentRounds.map(round => {
            // Truncate long responses for context
            const truncatedResponse = round.response.length > 500
                ? round.response.slice(0, 500) + '...'
                : round.response;
            const backendLabel = round.backend === 'codex' ? 'Codex' : 'Gemini';
            return `[Round ${round.roundNumber}]
User: ${round.userPrompt}
${backendLabel}: ${truncatedResponse}`;
        });
        return `# Conversation History\n\n${contextParts.join('\n\n')}`;
    }
    /**
     * Saves a session
     */
    async save(session) {
        await this.sessionManager.save(session.sessionId, session);
    }
    /**
     * Loads a session
     */
    async load(sessionId) {
        return await this.sessionManager.load(sessionId);
    }
    /**
     * Lists all sessions
     */
    async list() {
        return await this.sessionManager.list();
    }
    /**
     * Deletes a session
     */
    async delete(sessionId) {
        return await this.sessionManager.delete(sessionId);
    }
    /**
     * Gets or creates a session
     */
    async getOrCreate(sessionId) {
        const existing = await this.load(sessionId);
        if (existing) {
            return existing;
        }
        return this.createSession(sessionId);
    }
    /**
     * Gets cache statistics
     */
    async getStats() {
        return await this.sessionManager.getStats();
    }
}
// Export singleton instance
export const askSessionManager = new AskSessionManager();
// Backward compatibility aliases
export const AskGeminiSessionManager = AskSessionManager;
export const askGeminiSessionManager = askSessionManager;
//# sourceMappingURL=askSessionManager.js.map