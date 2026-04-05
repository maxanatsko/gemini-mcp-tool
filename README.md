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

**Version** `3.1.0`
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
| `ask` | Query Gemini or Codex with `@` file references |
| `ask-gemini` | Backward-compatible alias for `ask` |
| `brainstorm` | Creative ideation with frameworks |
| `review-code` | Interactive code review sessions |
| `ping` | Connection test |
| `help` | CLI documentation |

<br>

### Parameters

<br>

**ask** (or `ask-gemini`)

```
prompt      Required    Analysis request with @ syntax
backend     Optional    gemini (default) | codex
model       Optional    Backend-specific override
reasoningEffort Optional Codex-only: low|medium|high|xhigh
sandbox     Optional    Gemini sandbox / Codex workspace-write
sandboxMode Optional    Codex-only: read-only|workspace-write|danger-full-access
session     Optional    Conversation continuity
includeHistory Optional Include previous rounds
changeMode  Optional    Structured edit suggestions
```

<br>

---

<br>

## Links

<br>

[Documentation](https://maxanatsko.github.io/llm-cli-bridge/)
[Original Project](https://github.com/jamubc/gemini-mcp-tool)
[GitHub](https://github.com/maxanatsko/llm-cli-bridge)

<br>

---

<br>

<sub>MIT License — Not affiliated with Google or OpenAI</sub>
