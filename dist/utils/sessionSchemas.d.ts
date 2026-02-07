import { SessionData } from './sessionManager.js';
import { GitState } from './gitStateDetector.js';
/**
 * Review comment structure shared across review-code tooling.
 * Kept here (not in deprecated reviewSessionCache.ts) to avoid importing legacy sync-FS code at runtime.
 */
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
/**
 * One review iteration/round, including all comments generated in that round.
 */
export interface ReviewRound {
    roundNumber: number;
    timestamp: number;
    filesReviewed: string[];
    userPrompt: string;
    response: string;
    commentsGenerated: ReviewComment[];
    gitState: GitState;
}
/**
 * Ask Session Data
 * Tracks multi-turn Q&A conversations with context across backends
 */
export interface AskSessionData extends SessionData {
    /** History of all conversation rounds */
    conversationHistory: Array<{
        roundNumber: number;
        timestamp: number;
        userPrompt: string;
        response: string;
        model: string;
        tokenCount?: number;
        /** Which backend was used for this round */
        backend?: 'gemini' | 'codex';
    }>;
    /** Total number of rounds in this conversation */
    totalRounds: number;
    /** Files referenced with @ syntax across all rounds */
    contextFiles: string[];
    /** Optional metadata for categorization */
    metadata: {
        primaryTopic?: string;
        tags?: string[];
    };
    /** Codex thread ID for native session resume (only set when using Codex backend) */
    codexThreadId?: string;
    /** Last backend used (for continuing with same backend) */
    lastBackend?: 'gemini' | 'codex';
}
/**
 * Brainstorm Session Data
 * Tracks iterative ideation with ideas and feedback
 */
export interface BrainstormSessionData extends SessionData {
    /** Original brainstorming challenge */
    challenge: string;
    /** Methodology used (divergent, scamper, design-thinking, etc.) */
    methodology: string;
    /** Domain context if specified */
    domain?: string;
    /** Constraints if specified */
    constraints?: string;
    /** All brainstorming rounds */
    rounds: Array<{
        roundNumber: number;
        timestamp: number;
        userPrompt: string;
        response: string;
        ideasGenerated: Array<{
            ideaId: string;
            name: string;
            description: string;
            feasibility?: number;
            impact?: number;
            innovation?: number;
            status: 'active' | 'refined' | 'merged' | 'discarded';
            notes?: string;
        }>;
        /** Which backend was used for this round */
        backend?: 'gemini' | 'codex';
    }>;
    /** Total ideas generated across all rounds */
    totalIdeas: number;
    /** Number of ideas still active (not discarded or merged) */
    activeIdeas: number;
    /** History of refinement actions */
    refinementHistory: Array<{
        timestamp: number;
        action: 'refined' | 'merged' | 'discarded';
        ideaIds: string[];
        reason: string;
    }>;
    /** Codex thread ID for native session resume (only set when using Codex backend) */
    codexThreadId?: string;
    /** Last backend used (for continuing with same backend) */
    lastBackend?: 'gemini' | 'codex';
}
/**
 * Review-Code Session Data
 * Enhanced version of existing review session with shared infrastructure
 * Maintains backward compatibility while integrating with new SessionManager
 */
export interface ReviewCodeSessionData extends SessionData {
    /** Initial git state when review started */
    gitState: GitState;
    /** Current git state (updated each round) */
    currentGitState: GitState;
    /** All review rounds */
    rounds: ReviewRound[];
    /** All comments across all rounds */
    allComments: ReviewComment[];
    /** Files tracked across all rounds */
    filesTracked: string[];
    /** Files to focus on if specified */
    focusFiles?: string[];
    /** Review scope */
    reviewScope?: 'full' | 'changes-only' | 'focused';
    /** Total number of review rounds */
    totalRounds: number;
    /** Current session state */
    sessionState: 'active' | 'paused' | 'completed';
    /** Codex thread ID for native session resume (only set when using Codex backend) */
    codexThreadId?: string;
    /** Last backend used (for continuing with same backend) */
    lastBackend?: 'gemini' | 'codex';
}
export type AskGeminiSessionData = AskSessionData;
//# sourceMappingURL=sessionSchemas.d.ts.map