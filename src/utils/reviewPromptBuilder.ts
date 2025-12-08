import { CodeReviewSession, ReviewRound } from './reviewSessionCache.js';
import { GitState } from './gitStateDetector.js';
import { REVIEW } from '../constants.js';

export interface ReviewPromptConfig {
  userPrompt: string;
  session: CodeReviewSession;
  files?: string[];
  reviewType: string;
  includeHistory: boolean;
  currentGitState: GitState;
}

/**
 * Builds a context-aware review prompt for Gemini
 * @param config Review prompt configuration
 * @returns Formatted prompt string
 */
export function buildReviewPrompt(config: ReviewPromptConfig): string {
  const { userPrompt, session, files, reviewType, includeHistory, currentGitState } = config;

  // Build file references with @ syntax
  const fileRefs = files?.map(f => `@${f}`).join(' ') || '';

  let prompt = `# CODE REVIEW SESSION (Round ${session.totalRounds + 1})

## Review Context
- Session ID: ${session.sessionId}
- Branch: ${currentGitState.branch}
- Commit: ${currentGitState.commitHash.slice(0, 8)}
- Review Type: ${reviewType}
- Files: ${files?.length || 'all tracked'} ${files ? 'specified' : 'files'}

## Review Instructions
${getReviewTypeInstructions(reviewType)}

## Output Format
For each issue found, use this EXACT format:

**[SEVERITY: critical|important|suggestion|question]**
**File:** {filename}
**Lines:** {start}-{end} (if applicable, otherwise write "N/A")
**Issue:** {brief title}
**Details:** {explanation}
**Recommendation:** {suggested fix or action}

---

`;

  // Include conversation history if requested and exists
  if (includeHistory && session.rounds.length > 0) {
    prompt += formatPreviousRounds(session);
  }

  // Add user's current request
  prompt += `\n## Current Review Request\n`;
  if (fileRefs) {
    prompt += `${fileRefs}\n\n`;
  }
  prompt += `${userPrompt}\n`;

  return prompt;
}

/**
 * Returns review instructions based on review type
 * @param reviewType The type of review to perform
 * @returns Formatted instructions string
 */
export function getReviewTypeInstructions(reviewType: string): string {
  const instructions: Record<string, string> = {
    security: `Focus on:
- Input validation and sanitization
- Authentication and authorization flaws
- SQL injection, XSS, CSRF vulnerabilities
- Secrets exposure (hardcoded credentials, API keys)
- Dependency vulnerabilities
- Insecure cryptography and data handling`,

    performance: `Focus on:
- Algorithm complexity (O(n) analysis)
- Unnecessary loops or computations
- Memory leaks and inefficient data structures
- Database query optimization (N+1 queries, missing indexes)
- Caching opportunities
- Resource cleanup and connection pooling`,

    quality: `Focus on:
- Code clarity and readability
- Naming conventions and consistency
- DRY violations (repeated code)
- Error handling and edge cases
- Test coverage gaps
- Documentation completeness`,

    architecture: `Focus on:
- Design patterns and principles (SOLID, DRY, KISS)
- Module coupling and cohesion
- Scalability concerns
- API design and contracts
- Separation of concerns
- Technical debt and maintainability`,

    general: `Perform a comprehensive review covering:
- Security vulnerabilities
- Performance bottlenecks
- Code quality issues
- Architectural concerns
Prioritize critical and important issues.`
  };

  return instructions[reviewType] || instructions.general;
}

/**
 * Formats previous review rounds for context inclusion
 * @param session The current review session
 * @returns Formatted history string
 */
export function formatPreviousRounds(session: CodeReviewSession): string {
  let historyText = `\n## Previous Review Rounds\n`;

  // Get last N rounds based on constant
  const recentRounds = session.rounds.slice(-REVIEW.MAX_HISTORY_ROUNDS);

  for (const round of recentRounds) {
    historyText += `\n### Round ${round.roundNumber} (${new Date(round.timestamp).toLocaleString()})\n`;
    historyText += `**User Request:** ${round.userPrompt}\n`;
    historyText += `**Issues Found:** ${round.commentsGenerated.length}\n`;

    // Include resolved/modified comments
    const resolvedComments = round.commentsGenerated.filter(
      c => c.status !== 'pending'
    );

    if (resolvedComments.length > 0) {
      historyText += `\n**Resolved Issues:**\n`;
      resolvedComments.forEach(c => {
        const statusEmoji = c.status === 'accepted' ? '✅' : c.status === 'rejected' ? '❌' : '📝';
        historyText += `- [${statusEmoji} ${c.status.toUpperCase()}] ${c.filePattern}: ${c.comment.split('\n')[0]}`;
        if (c.resolution) {
          historyText += ` - ${c.resolution}`;
        }
        historyText += '\n';
      });
    }

    // Show pending critical/important issues
    const pendingImportant = round.commentsGenerated.filter(
      c => c.status === 'pending' && (c.severity === 'critical' || c.severity === 'important')
    );

    if (pendingImportant.length > 0) {
      historyText += `\n**Still Pending (Critical/Important):**\n`;
      pendingImportant.forEach(c => {
        const emoji = REVIEW.SEVERITY_EMOJI[c.severity as keyof typeof REVIEW.SEVERITY_EMOJI];
        historyText += `- ${emoji} ${c.filePattern}: ${c.comment.split('\n')[0]}\n`;
      });
    }
  }

  historyText += `\n**Total Issues Across All Rounds:** ${session.allComments.length}\n`;
  historyText += `**Files Reviewed:** ${session.filesTracked.length}\n\n`;

  return historyText;
}

/**
 * Extracts file patterns from a prompt containing @ references
 * @param prompt The prompt to parse
 * @returns Array of file patterns
 */
export function extractFilesFromPrompt(prompt: string): string[] {
  const filePattern = /@([^\s]+)/g;
  const matches: string[] = [];
  let match;

  while ((match = filePattern.exec(prompt)) !== null) {
    matches.push(match[1]);
  }

  return matches;
}
