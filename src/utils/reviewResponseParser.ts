import { randomUUID } from 'node:crypto';
import { ReviewComment } from './reviewSessionCache.js';
import { Logger } from './logger.js';

/**
 * Parses Gemini's review response into structured ReviewComment objects
 * @param geminiResponse The raw response from Gemini
 * @param roundNumber The current review round number
 * @returns Array of parsed review comments
 */
export function parseReviewResponse(
  geminiResponse: string,
  roundNumber: number
): ReviewComment[] {
  const comments: ReviewComment[] = [];

  try {
    // Pattern to match review comments with more flexible formatting
    // Handles variations in whitespace, asterisk count, and casing that LLMs might produce
    // More robust: \*{2,3} allows 2-3 asterisks, \s+ for flexible spacing, case-insensitive matching
    const commentPattern = /\*{2,3}\s*\[\s*SEVERITY\s*:\s*(critical|important|suggestion|question)\s*\]\s*\*{2,3}\s+\*{2,3}\s*File\s*:\s*\*{2,3}\s*([^\n]+?)\s+\*{2,3}\s*Lines\s*:\s*\*{2,3}\s*([^\n]+?)\s+\*{2,3}\s*Issue\s*:\s*\*{2,3}\s*([^\n]+?)\s+\*{2,3}\s*Details\s*:\s*\*{2,3}\s*([\s\S]+?)\s+\*{2,3}\s*Recommendation\s*:\s*\*{2,3}\s*([\s\S]+?)(?=\n\s*\*{2,3}\s*\[\s*SEVERITY|---|$)/gi;

    let match;
    let matchCount = 0;

    while ((match = commentPattern.exec(geminiResponse)) !== null) {
      matchCount++;
      const [_, severity, file, lines, issue, details, recommendation] = match;

      // Parse line range
      let lineRange: { start: number; end: number } | undefined;
      const linesStr = lines.trim();

      if (linesStr !== 'N/A' && linesStr.toLowerCase() !== 'n/a') {
        const lineMatch = linesStr.match(/(\d+)-(\d+)/);
        if (lineMatch) {
          lineRange = {
            start: parseInt(lineMatch[1], 10),
            end: parseInt(lineMatch[2], 10)
          };
        } else {
          // Single line number
          const singleLine = parseInt(linesStr, 10);
          if (!isNaN(singleLine)) {
            lineRange = { start: singleLine, end: singleLine };
          }
        }
      }

      const comment: ReviewComment = {
        id: generateCommentId(),
        filePattern: file.trim(),
        lineRange,
        severity: severity.trim().toLowerCase() as ReviewComment['severity'],
        comment: formatCommentText(issue.trim(), details.trim(), recommendation.trim()),
        roundGenerated: roundNumber,
        status: 'pending'
      };

      comments.push(comment);
    }

    Logger.debug(`Parsed ${matchCount} review comments from Gemini response`);

    // If no structured comments found, try fallback parsing
    if (comments.length === 0) {
      Logger.debug('No structured comments found, attempting fallback parsing');
      const fallbackComments = fallbackParse(geminiResponse, roundNumber);
      comments.push(...fallbackComments);
    }
  } catch (error) {
    Logger.error(`Error parsing review response: ${error}`);
    // Return empty array on parse error - caller can handle
  }

  return comments;
}

/**
 * Formats the comment text from parsed components
 * @param issue Brief issue title
 * @param details Detailed explanation
 * @param recommendation Suggested fix
 * @returns Formatted comment string
 */
function formatCommentText(issue: string, details: string, recommendation: string): string {
  return `${issue}

${details}

**Recommendation:** ${recommendation}`;
}

/**
 * Generates a unique comment ID using cryptographically secure UUID
 * @returns Comment ID string
 */
export function generateCommentId(): string {
  return `cmt-${randomUUID()}`;
}

/**
 * Fallback parser for when structured format isn't followed
 * Attempts to extract any review-like content
 * @param geminiResponse The raw response
 * @param roundNumber The round number
 * @returns Array of comments (may be empty or contain unstructured feedback)
 */
function fallbackParse(geminiResponse: string, roundNumber: number): ReviewComment[] {
  const comments: ReviewComment[] = [];

  // Look for common issue indicators
  const issuePatterns = [
    /(?:issue|problem|concern|warning|error):\s*(.+?)(?:\n\n|$)/gi,
    /(?:critical|important|security|vulnerability):\s*(.+?)(?:\n\n|$)/gi,
    /(?:recommendation|suggestion|fix):\s*(.+?)(?:\n\n|$)/gi,
  ];

  let foundAny = false;

  for (const pattern of issuePatterns) {
    let match;
    while ((match = pattern.exec(geminiResponse)) !== null) {
      foundAny = true;
      const comment: ReviewComment = {
        id: generateCommentId(),
        filePattern: 'Unknown',
        severity: 'suggestion',
        comment: match[1].trim(),
        roundGenerated: roundNumber,
        status: 'pending'
      };
      comments.push(comment);
    }
  }

  // If still nothing found and response has substantial content, create a general comment
  if (!foundAny && geminiResponse.trim().length > 50) {
    Logger.debug('Creating general unstructured comment from response');
    comments.push({
      id: generateCommentId(),
      filePattern: 'General',
      severity: 'question',
      comment: geminiResponse.trim(),
      roundGenerated: roundNumber,
      status: 'pending'
    });
  }

  return comments;
}

/**
 * Validates parsed comments for completeness
 * @param comments Array of comments to validate
 * @returns Array of valid comments
 */
export function validateComments(comments: ReviewComment[]): ReviewComment[] {
  return comments.filter(comment => {
    const isValid =
      comment.id &&
      comment.filePattern &&
      comment.severity &&
      comment.comment &&
      comment.comment.trim().length > 0;

    if (!isValid) {
      Logger.debug(`Filtered out invalid comment: ${JSON.stringify(comment)}`);
    }

    return isValid;
  });
}
