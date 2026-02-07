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
export declare function getChangeModeInstructions(prompt: string): string;
/**
 * Condensed change mode instructions for Codex backend.
 * Shorter version since Codex has different context handling.
 */
export declare function getChangeModeInstructionsCondensed(prompt: string): string;
//# sourceMappingURL=changeModeInstructions.d.ts.map