# Gemini MCP Tool

<br>

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   Model Context Protocol server for Google Gemini CLI           │
│                                                                 │
│   Claude ──────────────── Gemini                                │
│                                                                 │
│   Leverage Gemini's massive token window                        │
│   for large file and codebase analysis                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

<br>

**Version** `2.1.0`
**License** `MIT`

---

<br>

## Prerequisites

```
Node.js ≥ 16.0.0
Google Gemini CLI (configured)
```

<br>

---

<br>

## Installation

<br>

### Recommended

```bash
claude mcp add gemini-cli -- npx -y maxanatsko/gemini-mcp-tool
```

<br>

### Local Development

```bash
git clone https://github.com/maxanatsko/gemini-mcp-tool.git
cd gemini-mcp-tool

npm install
npm run build
npm link

claude mcp add gemini-cli -- gemini-mcp
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
    "gemini-cli": {
      "command": "npx",
      "args": ["-y", "maxanatsko/gemini-mcp-tool"]
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
ask gemini to analyze @src/main.js
use gemini to summarize @.
analyze @package.json dependencies
```

<br>

### General Questions

```
ask gemini about React best practices
use gemini to explain div centering
ask gemini for latest tech news
```

<br>

### Sandbox Mode

```
use gemini sandbox to run @script.py
ask gemini to safely test this code
use gemini sandbox to install numpy
```

<br>

---

<br>

## Tools

<br>

| Tool | Description |
|:-----|:------------|
| `ask-gemini` | Query Gemini with `@` file references |
| `brainstorm` | Creative ideation with frameworks |
| `review-code` | Interactive code review sessions |
| `ping` | Connection test |
| `help` | CLI documentation |

<br>

### Parameters

<br>

**ask-gemini**

```
prompt      Required    Analysis request with @ syntax
model       Optional    gemini-2.5-pro (default)
sandbox     Optional    Safe code execution
session     Optional    Conversation continuity
changeMode  Optional    Structured edit suggestions
```

<br>

---

<br>

## Links

<br>

[Documentation](https://jamubc.github.io/gemini-mcp-tool/)
[Original Project](https://github.com/jamubc/gemini-mcp-tool)
[This Fork](https://github.com/maxanatsko/gemini-mcp-tool)

<br>

---

<br>

<sub>MIT License — Not affiliated with Google</sub>
