import type { ReviewCodeSessionData as CodeReviewSession, ReviewRound, ReviewComment } from './sessionSchemas.js';
export interface ReviewFormatterConfig {
    session: CodeReviewSession;
    currentRound: ReviewRound;
    newComments: ReviewComment[];
    showHistory: boolean;
}
/**
 * Formats the review response for Claude
 * @param config Formatter configuration
 * @returns Formatted markdown string
 */
export declare function formatReviewResponse(config: ReviewFormatterConfig): string;
/**
 * Groups comments by file pattern
 * @param comments Array of comments
 * @returns Map of file patterns to comments
 */
export declare function groupCommentsByFile(comments: ReviewComment[]): Map<string, ReviewComment[]>;
/**
 * Formats a message when session expires or is not found
 * @param sessionId The session ID that was requested
 * @param currentGitBranch Current git branch
 * @param currentGitCommit Current git commit hash
 * @returns Formatted error message
 */
export declare function formatSessionNotFound(sessionId: string, currentGitBranch: string, currentGitCommit: string): string;
/**
 * Formats a warning message for git state changes
 * @param reason The reason for the warning
 * @param continuing Whether the session is continuing anyway
 * @returns Formatted warning string
 */
export declare function formatGitStateWarning(reason: string, continuing: boolean): string;
//# sourceMappingURL=reviewFormatter.d.ts.map