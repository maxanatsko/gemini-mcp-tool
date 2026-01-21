# Installation

Multiple ways to install AI CLI MCP Server, depending on your needs.

## Prerequisites

- Node.js v16.0.0 or higher
- Claude Desktop or Claude Code with MCP support
- Gemini CLI installed (`npm install -g @google/gemini-cli`) and/or Codex CLI

## Method 1: NPX (Recommended)

No installation needed - runs directly:

```json
{
  "mcpServers": {
    "ai-cli": {
      "command": "npx",
      "args": ["-y", "@maxanatsko/ai-cli-mcp-server"]
    }
  }
}
```

## Method 2: Global Installation

```bash
claude mcp add ai-cli -- npx -y @maxanatsko/ai-cli-mcp-server
```

Then configure:
```json
{
  "mcpServers": {
    "ai-cli": {
      "command": "ai-cli-mcp"
    }
  }
}
```

## Method 3: Local Project

```bash
npm install @maxanatsko/ai-cli-mcp-server
```

See [Getting Started](/getting-started) for full setup instructions.