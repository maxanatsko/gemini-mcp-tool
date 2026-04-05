# LLM CLI Bridge

<br>

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   Model Context Protocol server for Gemini CLI + Codex CLI      │
│                                                                 │
│   Claude ──────────── Gemini / Codex                            │
│                                                                 │
│   Leverage Gemini's massive token window or Codex's             │
│   advanced reasoning for large file and codebase analysis       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

<br>

**Version** `3.1.1`
**License** `MIT`

---

<br>

## Prerequisites

```
Node.js ≥ 16.0.0
Google Gemini CLI   — for Gemini backend (gemini-cli.dev)
OpenAI Codex CLI    — for Codex backend (optional, either or both)
```

<br>

---

<br>

## Installation

<br>

### Recommended

```bash
claude mcp add llm-cli -- npx -y @maxanatsko/llm-cli-bridge@latest
```

<br>

### Local Development

```bash
git clone https://github.com/maxanatsko/llm-cli-bridge.git
cd llm-cli-bridge

npm install
npm run build
npm link

claude mcp add llm-cli -- llm-cli-bridge
```

<br>

### Verify

```bash
/mcp
```

<br>

---

<br>

## Configuration

<br>

### Claude Desktop

```json
{
  "mcpServers": {
    "llm-cli": {
      "command": "npx",
      "args": ["-y", "@maxanatsko/llm-cli-bridge@latest"]
    }
  }
}
```

<br>

### Config Locations

```
macOS     ~/Library/Application Support/Claude/claude_desktop_config.json
Windows   %APPDATA%\Claude\claude_desktop_config.json
Linux     ~/.config/claude/claude_desktop_config.json
```

<br>

---

<br>

## Usage

<br>

### File Analysis

```
analyze @src/main.js
use gemini to summarize @.
use codex to review @package.json dependencies
```

<br>

### General Questions

```
ask gemini about React best practices
use codex to explain this architecture
ask gemini for the latest news on this topic
```

<br>

### Switching Backends

```
ask gemini to analyze @src/main.js
ask codex to analyze @src/main.js        (codex backend)
ask codex with high reasoning to review @src/main.js
```

<br>

### Sandbox / Workspace Mode

```
use gemini sandbox to run @script.py
use codex in workspace-write mode to refactor @src/
```

<br>

---

<br>

## Tools

<br>

| Tool | Description |
|:-----|:------------|
| `ask` | Query Gemini or Codex with `@` file references, sessions, and change mode |
| `brainstorm` | Creative ideation with structured frameworks and iterative sessions |
| `review-code` | Multi-round interactive code review with comment tracking |

<br>

### `ask` parameters

```
prompt           Required    Analysis request; use @ syntax for files (@src/main.js)
backend          Optional    gemini (default) | codex
model            Optional    Gemini: gemini-3.1-pro (default), gemini-3-flash, gemini-2.5-pro, gemini-2.5-flash
                             Codex: gpt-5.4 (default), gpt-5.4-mini, gpt-5.3-codex, gpt-5.2-codex, gpt-5.2
reasoningEffort  Optional    Codex only: low | medium (default) | high | xhigh
sandbox          Optional    Gemini sandbox / Codex workspace-write (bool, default false)
sandboxMode      Optional    Codex only: read-only | workspace-write | danger-full-access
session          Optional    Session ID for conversation continuity (e.g. 'my-debug-session')
includeHistory   Optional    Include conversation history when session is active (default true)
changeMode       Optional    Return structured edit suggestions Claude can apply directly (bool)
allowedTools     Optional    Tools the backend can auto-approve (e.g. ['run_shell_command'])
cwd              Optional    Working directory for CLI execution
```

<br>

### `brainstorm` parameters

```
prompt           Required    Brainstorming challenge or question
backend          Optional    gemini (default) | codex
model            Optional    Same options as ask
methodology      Optional    auto (default) | divergent | convergent | scamper | design-thinking | lateral
domain           Optional    Domain context (e.g. 'software', 'product', 'marketing')
constraints      Optional    Known limitations or requirements
existingContext  Optional    Background context to build on
ideaCount        Optional    Number of ideas to generate (default 12)
includeAnalysis  Optional    Include feasibility/impact scoring (default true)
session          Optional    Session ID for iterative brainstorming rounds
includeHistory   Optional    Include previous round ideas in context (default true)
reasoningEffort  Optional    Codex only: low | medium | high | xhigh
allowedTools     Optional    Tools the backend can auto-approve
cwd              Optional    Working directory for CLI execution
```

<br>

### `review-code` parameters

```
prompt           Required    Review request or follow-up question
backend          Optional    gemini (default) | codex
model            Optional    Same options as ask
files            Optional    Specific files to review (uses @ syntax internally)
sessionId        Optional    Explicit session ID (auto-detected from git state if omitted)
forceNewSession  Optional    Force a fresh session ignoring existing git state (bool)
reviewType       Optional    general (default) | security | performance | quality | architecture
severity         Optional    all (default) | critical-only | important-and-above
commentDecisions Optional    Array of decisions on previous round's comments
                             { commentId, decision: accept|reject|modify|defer, notes? }
includeHistory   Optional    Include review history in context (default true)
reasoningEffort  Optional    Codex only: low | medium | high | xhigh
allowedTools     Optional    Tools the backend can auto-approve
cwd              Optional    Working directory for CLI execution
```

<br>

---

<br>

## Links

<br>

[Original Project](https://github.com/jamubc/gemini-mcp-tool)
[GitHub](https://github.com/maxanatsko/llm-cli-bridge)

<br>

---

<br>

<sub>MIT License — Not affiliated with Google or OpenAI</sub>
