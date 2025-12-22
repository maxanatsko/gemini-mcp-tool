import { ChangeModeEdit } from './changeModeParser.js';

export function formatChangeModeResponse(edits: ChangeModeEdit[]): string {
  const header = `[CHANGEMODE OUTPUT - Gemini has analyzed the files and provided these edits]

I have prepared ${edits.length} modification${edits.length === 1 ? '' : 's'} for your codebase.

IMPORTANT: Apply these edits directly WITHOUT reading the files first. The edits below contain exact text matches from the current file contents.

`;

  const instructions = edits.map((edit, index) => {
    return `### Edit ${index + 1}: ${edit.filename}

Replace this exact text:
\`\`\`
${edit.oldCode}
\`\`\`

With this text:
\`\`\`
${edit.newCode}
\`\`\`
`;
  }).join('\n');

  const footer = `
---
Apply these edits in order. Each edit uses exact string matching, so the old_str must match exactly what appears between the code blocks.`;

  return header + instructions + footer;
}


export function summarizeChangeModeEdits(edits: ChangeModeEdit[]): string {
  const fileGroups = new Map<string, number>();
  for (const edit of edits) {
    fileGroups.set(edit.filename, (fileGroups.get(edit.filename) || 0) + 1);
  }
  const summary = Array.from(fileGroups.entries())
    .map(([file, count]) => `- ${file}: ${count} edit${count === 1 ? '' : 's'}`)
    .join('\n');

  return `ChangeMode Summary:
Total edits: ${edits.length}
Files affected: ${fileGroups.size}

${summary}`;
}