import { REVIEW, SESSION } from '../constants.js';
/**
 * Formats the review response for Claude
 * @param config Formatter configuration
 * @returns Formatted markdown string
 */
export function formatReviewResponse(config) {
    const { session, currentRound, newComments, showHistory } = config;
    let output = `# Code Review - Round ${currentRound.roundNumber}\n\n`;
    // Session info
    output += `**Session:** \`${session.sessionId}\`\n`;
    output += `**Branch:** ${session.currentGitState.branch} @ ${session.currentGitState.commitHash.slice(0, 8)}\n`;
    output += `**Files Reviewed:** ${currentRound.filesReviewed.length}\n\n`;
    // Summary
    output += formatSummary(newComments);
    // Comments by file
    if (newComments.length > 0) {
        output += `## Issues Found\n\n`;
        output += formatCommentsByFile(newComments);
    }
    else {
        output += `## Result\n\n`;
        output += `✅ No new issues found in this round.\n\n`;
    }
    // Session continuation instructions
    output += formatContinuationInstructions(session);
    // History summary if enabled
    if (showHistory && session.rounds.length > 1) {
        output += formatHistorySummary(session);
    }
    return output;
}
/**
 * Formats the summary section with severity counts
 * @param comments Array of comments to summarize
 * @returns Formatted summary string
 */
function formatSummary(comments) {
    const criticalCount = comments.filter(c => c.severity === 'critical').length;
    const importantCount = comments.filter(c => c.severity === 'important').length;
    const suggestionCount = comments.filter(c => c.severity === 'suggestion').length;
    const questionCount = comments.filter(c => c.severity === 'question').length;
    let summary = `## Summary\n`;
    summary += `- 🔴 Critical: ${criticalCount}\n`;
    summary += `- 🟠 Important: ${importantCount}\n`;
    summary += `- 🟡 Suggestions: ${suggestionCount}\n`;
    summary += `- 💬 Questions: ${questionCount}\n`;
    summary += `- **Total:** ${comments.length} issues\n\n`;
    return summary;
}
/**
 * Formats comments grouped by file
 * @param comments Array of comments to format
 * @returns Formatted comments string
 */
function formatCommentsByFile(comments) {
    const commentsByFile = groupCommentsByFile(comments);
    let output = '';
    for (const [file, fileComments] of commentsByFile) {
        output += `### ${file}\n\n`;
        fileComments.forEach((comment, idx) => {
            const severityEmoji = REVIEW.SEVERITY_EMOJI[comment.severity] || '📌';
            output += `#### ${severityEmoji} Issue ${idx + 1}\n`;
            output += `**Comment ID:** \`${comment.id}\`\n`;
            if (comment.lineRange) {
                if (comment.lineRange.start === comment.lineRange.end) {
                    output += `**Line:** ${comment.lineRange.start}\n`;
                }
                else {
                    output += `**Lines:** ${comment.lineRange.start}-${comment.lineRange.end}\n`;
                }
            }
            output += `\n${comment.comment}\n\n`;
            output += `---\n\n`;
        });
    }
    return output;
}
/**
 * Groups comments by file pattern
 * @param comments Array of comments
 * @returns Map of file patterns to comments
 */
export function groupCommentsByFile(comments) {
    const groups = new Map();
    // Sort comments by severity first
    const sortedComments = [...comments].sort((a, b) => {
        const severityOrder = { critical: 0, important: 1, suggestion: 2, question: 3 };
        return severityOrder[a.severity] - severityOrder[b.severity];
    });
    sortedComments.forEach(comment => {
        const existing = groups.get(comment.filePattern) || [];
        existing.push(comment);
        groups.set(comment.filePattern, existing);
    });
    return groups;
}
/**
 * Formats continuation instructions
 * @param session The current session
 * @returns Formatted instructions string
 */
function formatContinuationInstructions(session) {
    const reviewTtlMs = SESSION.TOOL_CONFIGS['review-code']?.TTL ?? SESSION.DEFAULT_TTL;
    const expiryDate = new Date(session.lastAccessedAt + reviewTtlMs);
    let instructions = `## Continue Review\n\n`;
    instructions += `To continue this review session:\n`;
    instructions += `1. Make your code changes based on the feedback above\n`;
    instructions += `2. Call the \`review-code\` tool again (session auto-detected from git state)\n`;
    instructions += `3. Optionally provide \`commentDecisions\` to track which issues you've addressed\n\n`;
    instructions += `**Example:**\n`;
    instructions += '```json\n';
    instructions += `{
  "name": "review-code",
  "arguments": {
    "prompt": "I've fixed the security issues. Please review.",
    "commentDecisions": [
      {"commentId": "cmt-xxx", "decision": "accepted", "notes": "Fixed"}
    ]
  }
}
`;
    instructions += '```\n\n';
    instructions += `**Session Details:**\n`;
    instructions += `- Session ID: \`${session.sessionId}\`\n`;
    instructions += `- Expires: ${expiryDate.toLocaleString()}\n`;
    instructions += `- Git State: ${session.currentGitState.branch} @ ${session.currentGitState.commitHash.slice(0, 8)}\n\n`;
    return instructions;
}
/**
 * Formats the history summary
 * @param session The current session
 * @returns Formatted history string
 */
function formatHistorySummary(session) {
    let history = `## Review History\n\n`;
    // Exclude current (last) round from history summary
    const previousRounds = session.rounds.slice(0, -1);
    if (previousRounds.length === 0) {
        return '';
    }
    history += `| Round | Files | Issues | Resolved | Pending |\n`;
    history += `|-------|-------|--------|----------|----------|\n`;
    previousRounds.forEach(round => {
        const resolved = round.commentsGenerated.filter(c => c.status !== 'pending').length;
        const pending = round.commentsGenerated.filter(c => c.status === 'pending').length;
        history += `| ${round.roundNumber} | ${round.filesReviewed.length} | ${round.commentsGenerated.length} | ${resolved} | ${pending} |\n`;
    });
    history += `\n`;
    // Overall statistics
    const totalResolved = session.allComments.filter(c => c.status !== 'pending').length;
    const totalPending = session.allComments.filter(c => c.status === 'pending').length;
    history += `**Overall Progress:**\n`;
    history += `- Total Issues: ${session.allComments.length}\n`;
    history += `- Resolved: ${totalResolved}\n`;
    history += `- Pending: ${totalPending}\n`;
    history += `- Files Tracked: ${session.filesTracked.length}\n\n`;
    return history;
}
/**
 * Formats a message when session expires or is not found
 * @param sessionId The session ID that was requested
 * @param currentGitBranch Current git branch
 * @param currentGitCommit Current git commit hash
 * @returns Formatted error message
 */
export function formatSessionNotFound(sessionId, currentGitBranch, currentGitCommit) {
    const reviewTtlMs = SESSION.TOOL_CONFIGS['review-code']?.TTL ?? SESSION.DEFAULT_TTL;
    const ttlHours = Math.round((reviewTtlMs / (60 * 60 * 1000)) * 10) / 10;
    return `⚠️ **Session Not Found or Expired**

The review session \`${sessionId}\` was not found or has expired.

**Current Git State:**
- Branch: ${currentGitBranch}
- Commit: ${currentGitCommit.slice(0, 8)}

**Available Options:**
1. Start a new review session with \`forceNewSession: true\`
2. Wait if you just made a commit (session auto-creates based on current git state)

**Note:** Review sessions expire after ${ttlHours} hour(s) of inactivity.
`;
}
/**
 * Formats a warning message for git state changes
 * @param reason The reason for the warning
 * @param continuing Whether the session is continuing anyway
 * @returns Formatted warning string
 */
export function formatGitStateWarning(reason, continuing) {
    let warning = `⚠️ **Git State Changed**\n\n${reason}\n\n`;
    if (continuing) {
        warning += `Continuing with existing session. Use \`forceNewSession: true\` to start fresh.\n`;
    }
    else {
        warning += `Creating new session for current git state.\n`;
    }
    return warning;
}
//# sourceMappingURL=reviewFormatter.js.map