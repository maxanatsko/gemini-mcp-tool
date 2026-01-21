/**
 * Change Mode Instructions
 *
 * Shared instructions for AI backends to generate structured code modifications
 * in the OLD/NEW format that can be applied programmatically.
 */

/**
 * Full change mode instructions with detailed examples.
 * Used by Gemini backend and geminiExecutor.
 */
export function getChangeModeInstructions(prompt: string): string {
  return `
[CHANGEMODE INSTRUCTIONS]
You are generating code modifications that will be processed by an automated system. The output format is critical because it enables programmatic application of changes without human intervention.

INSTRUCTIONS:
1. Analyze each provided file thoroughly
2. Identify locations requiring changes based on the user request
3. For each change, output in the exact format specified
4. The OLD section must be EXACTLY what appears in the file (copy-paste exact match)
5. Provide complete, directly replacing code blocks
6. Verify line numbers are accurate

CRITICAL REQUIREMENTS:
1. Output edits in the EXACT format specified below - no deviations
2. The OLD string MUST be findable with Ctrl+F - it must be a unique, exact match
3. Include enough surrounding lines to make the OLD string unique
4. If a string appears multiple times (like </div>), include enough context lines above and below to make it unique
5. Copy the OLD content EXACTLY as it appears - including all whitespace, indentation, line breaks
6. Never use partial lines - always include complete lines from start to finish

OUTPUT FORMAT (follow exactly):
**FILE: [filename]:[line_number]**
\`\`\`
OLD:
[exact code to be replaced - must match file content precisely]
NEW:
[new code to insert - complete and functional]
\`\`\`

EXAMPLE 1 - Simple unique match:
**FILE: src/utils/helper.js:100**
\`\`\`
OLD:
function getMessage() {
  return "Hello World";
}
NEW:
function getMessage() {
  return "Hello Universe!";
}
\`\`\`

EXAMPLE 2 - Common tag needing context:
**FILE: index.html:245**
\`\`\`
OLD:
        </div>
      </div>
    </section>
NEW:
        </div>
      </footer>
    </section>
\`\`\`

IMPORTANT: The OLD section must be an EXACT copy from the file that can be found with Ctrl+F!

USER REQUEST:
${prompt}
`;
}

/**
 * Condensed change mode instructions for Codex backend.
 * Shorter version since Codex has different context handling.
 */
export function getChangeModeInstructionsCondensed(prompt: string): string {
  return `
[CHANGEMODE INSTRUCTIONS]
You are generating code modifications. Output changes in a structured format that can be applied programmatically.

OUTPUT FORMAT (follow exactly):
**FILE: [filename]:[line_number]**
\`\`\`
OLD:
[exact code to be replaced]
NEW:
[new code to insert]
\`\`\`

REQUIREMENTS:
1. The OLD section must match the file content EXACTLY
2. Include enough context to make the match unique
3. Provide complete, functional replacement code

USER REQUEST:
${prompt}
`;
}
