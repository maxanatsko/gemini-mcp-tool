import type { ReviewComment } from './sessionSchemas.js';
/**
 * Parses review response into structured ReviewComment objects
 * @param responseText The raw response from the AI backend
 * @param roundNumber The current review round number
 * @returns Array of parsed review comments
 */
export declare function parseReviewResponse(responseText: string, roundNumber: number): ReviewComment[];
/**
 * Generates a unique comment ID using cryptographically secure UUID
 * @returns Comment ID string
 */
export declare function generateCommentId(): string;
/**
 * Validates parsed comments for completeness
 * @param comments Array of comments to validate
 * @returns Array of valid comments
 */
export declare function validateComments(comments: ReviewComment[]): ReviewComment[];
//# sourceMappingURL=reviewResponseParser.d.ts.map