import type { ReviewCodeSessionData as CodeReviewSession } from './sessionSchemas.js';
import { GitState } from './gitStateDetector.js';
export interface ReviewPromptConfig {
    userPrompt: string;
    session: CodeReviewSession;
    files?: string[];
    reviewType: string;
    includeHistory: boolean;
    currentGitState: GitState;
}
/**
 * Builds a context-aware review prompt for the AI backend
 * @param config Review prompt configuration
 * @returns Formatted prompt string
 */
export declare function buildReviewPrompt(config: ReviewPromptConfig): string;
/**
 * Returns review instructions based on review type
 * @param reviewType The type of review to perform
 * @returns Formatted instructions string
 */
export declare function getReviewTypeInstructions(reviewType: string): string;
/**
 * Formats previous review rounds for context inclusion
 * @param session The current review session
 * @returns Formatted history string
 */
export declare function formatPreviousRounds(session: CodeReviewSession): string;
/**
 * Extracts file patterns from a prompt containing @ references
 * @param prompt The prompt to parse
 * @returns Array of file patterns
 */
export declare function extractFilesFromPrompt(prompt: string): string[];
//# sourceMappingURL=reviewPromptBuilder.d.ts.map