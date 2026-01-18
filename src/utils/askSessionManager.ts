import { SessionManager } from './sessionManager.js';
import { AskSessionData } from './sessionSchemas.js';

/**
 * Session manager for ask tool
 * Tracks multi-turn conversations with context across backends
 */
export class AskSessionManager {
  private sessionManager: SessionManager<AskSessionData>;

  constructor() {
    this.sessionManager = new SessionManager<AskSessionData>('ask');
  }

  /**
   * Creates a new conversation session
   */
  createSession(sessionId: string): AskSessionData {
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
  addRound(
    session: AskSessionData,
    userPrompt: string,
    response: string,
    model: string,
    contextFiles?: string[],
    backend?: 'gemini' | 'codex',
    codexThreadId?: string
  ): AskSessionData {
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
  buildConversationContext(session: AskSessionData, maxRounds: number = 3): string {
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
  async save(session: AskSessionData): Promise<void> {
    await this.sessionManager.save(session.sessionId, session);
  }

  /**
   * Loads a session
   */
  async load(sessionId: string): Promise<AskSessionData | null> {
    return await this.sessionManager.load(sessionId);
  }

  /**
   * Lists all sessions
   */
  async list(): Promise<AskSessionData[]> {
    return await this.sessionManager.list();
  }

  /**
   * Deletes a session
   */
  async delete(sessionId: string): Promise<boolean> {
    return await this.sessionManager.delete(sessionId);
  }

  /**
   * Gets or creates a session
   */
  async getOrCreate(sessionId: string): Promise<AskSessionData> {
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
