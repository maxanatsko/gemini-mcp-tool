import { SessionManager } from './sessionManager.js';
import { randomUUID } from 'node:crypto';
/**
 * Session manager for brainstorm tool
 * Tracks iterative ideation with ideas and feedback
 */
export class BrainstormSessionManager {
    sessionManager;
    constructor() {
        this.sessionManager = new SessionManager('brainstorm');
    }
    /**
     * Creates a new brainstorming session
     */
    createSession(sessionId, challenge, methodology, domain, constraints) {
        const now = Date.now();
        return {
            sessionId,
            createdAt: now,
            lastAccessedAt: now,
            challenge,
            methodology,
            domain,
            constraints,
            rounds: [],
            totalIdeas: 0,
            activeIdeas: 0,
            refinementHistory: []
        };
    }
    /**
     * Adds a brainstorming round with generated ideas
     */
    addRound(session, userPrompt, response, ideas, backend, codexThreadId) {
        const parsedIdeas = ideas.map(idea => ({
            ideaId: `idea-${randomUUID()}`,
            name: idea.name,
            description: idea.description,
            feasibility: idea.feasibility,
            impact: idea.impact,
            innovation: idea.innovation,
            status: 'active'
        }));
        session.rounds.push({
            roundNumber: session.rounds.length + 1,
            timestamp: Date.now(),
            userPrompt,
            response,
            ideasGenerated: parsedIdeas,
            backend
        });
        session.totalIdeas += parsedIdeas.length;
        session.activeIdeas += parsedIdeas.length;
        session.lastAccessedAt = Date.now();
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
     * Records idea refinement action
     */
    refineIdeas(session, action, ideaIds, reason) {
        session.refinementHistory.push({
            timestamp: Date.now(),
            action,
            ideaIds,
            reason
        });
        // Update idea statuses
        for (const round of session.rounds) {
            for (const idea of round.ideasGenerated) {
                if (ideaIds.includes(idea.ideaId)) {
                    if (action === 'discarded') {
                        idea.status = 'discarded';
                        session.activeIdeas--;
                    }
                    else if (action === 'merged') {
                        idea.status = 'merged';
                        session.activeIdeas--;
                    }
                    else {
                        idea.status = 'refined';
                    }
                }
            }
        }
        return session;
    }
    /**
     * Builds context from previous rounds' ideas
     * @param session The session to build context from
     * @param activeOnly Only include active/refined ideas (exclude discarded/merged)
     * @returns Formatted ideas context
     */
    buildIdeasContext(session, activeOnly = true) {
        if (session.rounds.length === 0) {
            return '';
        }
        const allIdeas = session.rounds.flatMap(round => round.ideasGenerated);
        const filteredIdeas = activeOnly
            ? allIdeas.filter(idea => idea.status === 'active' || idea.status === 'refined')
            : allIdeas;
        if (filteredIdeas.length === 0) {
            return '';
        }
        const ideaList = filteredIdeas.map(idea => {
            let ideaText = `- **${idea.name}**: ${idea.description}`;
            if (idea.status !== 'active') {
                ideaText += ` [${idea.status.toUpperCase()}]`;
            }
            if (idea.feasibility || idea.impact || idea.innovation) {
                const scores = [];
                if (idea.feasibility)
                    scores.push(`Feasibility: ${idea.feasibility}/10`);
                if (idea.impact)
                    scores.push(`Impact: ${idea.impact}/10`);
                if (idea.innovation)
                    scores.push(`Innovation: ${idea.innovation}/10`);
                ideaText += ` (${scores.join(', ')})`;
            }
            return ideaText;
        }).join('\n');
        return `# Previously Generated Ideas\n\n${ideaList}`;
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
    async getOrCreate(sessionId, challenge, methodology, domain, constraints) {
        const existing = await this.load(sessionId);
        if (existing) {
            return existing;
        }
        return this.createSession(sessionId, challenge, methodology, domain, constraints);
    }
    /**
     * Gets cache statistics
     */
    async getStats() {
        return await this.sessionManager.getStats();
    }
}
// Export singleton instance
export const brainstormSessionManager = new BrainstormSessionManager();
//# sourceMappingURL=brainstormSessionManager.js.map