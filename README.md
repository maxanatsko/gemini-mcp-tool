
# Gemini MCP Tool v2.0.0 🚀

<div align="center">

[![GitHub Release](https://img.shields.io/github/v/release/maxanatsko/gemini-mcp-tool?logo=github&label=GitHub)](https://github.com/maxanatsko/gemini-mcp-tool/releases)
[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/maxanatsko/gemini-mcp-tool)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Open Source](https://img.shields.io/badge/Open%20Source-❤️-red.svg)](https://github.com/maxanatsko/gemini-mcp-tool)

</div>

> **🎉 v2.0.0 Release** - Major async refactor with improved performance, error handling, and code quality!

This is a Model Context Protocol (MCP) server that allows AI assistants to interact with the [Gemini CLI](https://github.com/google-gemini/gemini-cli). It enables the AI to leverage the power of Gemini's massive token window for large analysis, especially with large files and codebases using the `@` syntax for direction.

- Ask gemini natural questions, through claude or Brainstorm new ideas in a party of 3!

> 📚 **Original Documentation**: [View Full Documentation](https://jamubc.github.io/gemini-mcp-tool/) - Examples, FAQ, Troubleshooting, Best Practices

## TLDR: [![Claude](https://img.shields.io/badge/Claude-D97757?logo=claude&logoColor=fff)](#) + [![Google Gemini](https://img.shields.io/badge/Google%20Gemini-886FBF?logo=googlegemini&logoColor=fff)](#)

**Goal**: Use Gemini's powerful analysis capabilities directly in Claude Code to save tokens and analyze large files.

## 🎯 What's New in v2.0.0

This fork includes a **major async refactor** that addresses all code quality issues and modernizes the codebase:

### ✅ **17 Improvements Implemented**
- **100% Async I/O**: All file operations converted from `fs` to `fs/promises` (no event loop blocking)
- **Robust Error Handling**: Fixed all empty catch blocks with proper logging and user feedback
- **Optimized Cleanup**: Session cleanup now runs at 80% threshold (not on every save)
- **Enhanced Security**: Improved session ID sanitization with 3-step regex validation
- **Graceful Degradation**: Session failures no longer break tool functionality
- **Consistent LRU**: All tools now use LRU eviction policy for better performance
- **Type Safety**: Maintained generic `SessionManager<T>` with full type safety
- **Better Logging**: Consistent log levels with tool-specific prefixes

### 🔧 **Technical Highlights**
- Lazy initialization with race condition protection
- Helper methods to reduce code duplication
- Centralized configuration defaults
- `createdAt` field always guaranteed to be set
- Async error handling in tool integrations

### 📊 **Test Results**
✅ All 3 comprehensive integration tests pass
✅ TypeScript compiles with zero errors
✅ Gemini code review validates improvements

> **Breaking Change**: All SessionManager methods are now async. Update any custom code that directly uses SessionManager to use `await`.

## Prerequisites

Before using this tool, ensure you have:

1. **[Node.js](https://nodejs.org/)** (v16.0.0 or higher)
2. **[Google Gemini CLI](https://github.com/google-gemini/gemini-cli)** installed and configured


### Installation Options

#### Option 1: Install from GitHub Fork (Recommended for v2.0.0)

```bash
claude mcp add gemini-cli -- npx -y maxanatsko/gemini-mcp-tool
```

#### Option 2: Install Locally (For Development)

```bash
# Clone the repository
git clone https://github.com/maxanatsko/gemini-mcp-tool.git
cd gemini-mcp-tool

# Build and link
npm install
npm run build
npm link

# Add to Claude
claude mcp add gemini-cli -- gemini-mcp
```

#### Option 3: Original NPM Package (v1.1.4 - without async refactor)

```bash
claude mcp add gemini-cli -- npx -y gemini-mcp-tool
```

### Verify Installation

Type `/mcp` inside Claude Code to verify the gemini-cli MCP is active.

---

### Alternative: Import from Claude Desktop

If you already have it configured in Claude Desktop:

1. Add to your Claude Desktop config:
```json
"gemini-cli": {
  "command": "npx",
  "args": ["-y", "maxanatsko/gemini-mcp-tool"]
}
```

2. Import to Claude Code:
```bash
claude mcp add-from-claude-desktop
```

## Configuration

Register the MCP server with your MCP client:

### For NPX Usage (Recommended)

Add this configuration to your Claude Desktop config file:

```json
{
  "mcpServers": {
    "gemini-cli": {
      "command": "npx",
      "args": ["-y", "gemini-mcp-tool"]
    }
  }
}
```

### For Global Installation

If you installed globally, use this configuration instead:

```json
{
  "mcpServers": {
    "gemini-cli": {
      "command": "gemini-mcp"
    }
  }
}
```

**Configuration File Locations:**

- **Claude Desktop**:
  - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
  - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
  - **Linux**: `~/.config/claude/claude_desktop_config.json`

After updating the configuration, restart your terminal session.

## Example Workflow

- **Natural language**: "use gemini to explain index.html", "understand the massive project using gemini", "ask gemini to search for latest news"
- **Claude Code**: Type `/gemini-cli` and commands will populate in Claude Code's interface.

## Usage Examples

### With File References (using @ syntax)

- `ask gemini to analyze @src/main.js and explain what it does`
- `use gemini to summarize @. the current directory`
- `analyze @package.json and tell me about dependencies`

### General Questions (without files)

- `ask gemini to search for the latest tech news`
- `use gemini to explain div centering`
- `ask gemini about best practices for React development related to @file_im_confused_about`

### Using Gemini CLI's Sandbox Mode (-s)

The sandbox mode allows you to safely test code changes, run scripts, or execute potentially risky operations in an isolated environment.

- `use gemini sandbox to create and run a Python script that processes data`
- `ask gemini to safely test @script.py and explain what it does`
- `use gemini sandbox to install numpy and create a data visualization`
- `test this code safely: Create a script that makes HTTP requests to an API`

### Tools (for the AI)

These tools are designed to be used by the AI assistant.

- **`ask-gemini`**: Asks Google Gemini for its perspective. Can be used for general questions or complex analysis of files.
  - **`prompt`** (required): The analysis request. Use the `@` syntax to include file or directory references (e.g., `@src/main.js explain this code`) or ask general questions (e.g., `Please use a web search to find the latest news stories`).
  - **`model`** (optional): The Gemini model to use. Defaults to `gemini-2.5-pro`.
  - **`sandbox`** (optional): Set to `true` to run in sandbox mode for safe code execution.
- **`sandbox-test`**: Safely executes code or commands in Gemini's sandbox environment. Always runs in sandbox mode.
  - **`prompt`** (required): Code testing request (e.g., `Create and run a Python script that...` or `@script.py Run this safely`).
  - **`model`** (optional): The Gemini model to use.
- **`Ping`**: A simple test tool that echoes back a message.
- **`Help`**: Shows the Gemini CLI help text.

### Slash Commands (for the User)

You can use these commands directly in Claude Code's interface (compatibility with other clients has not been tested).

- **/analyze**: Analyzes files or directories using Gemini, or asks general questions.
  - **`prompt`** (required): The analysis prompt. Use `@` syntax to include files (e.g., `/analyze prompt:@src/ summarize this directory`) or ask general questions (e.g., `/analyze prompt:Please use a web search to find the latest news stories`).
- **/sandbox**: Safely tests code or scripts in Gemini's sandbox environment.
  - **`prompt`** (required): Code testing request (e.g., `/sandbox prompt:Create and run a Python script that processes CSV data` or `/sandbox prompt:@script.py Test this script safely`).
- **/help**: Displays the Gemini CLI help information.
- **/ping**: Tests the connection to the server.
  - **`message`** (optional): A message to echo back.

## About This Fork

This is a fork of [jamubc/gemini-mcp-tool](https://github.com/jamubc/gemini-mcp-tool) with significant improvements:

- **v2.0.0**: Complete async refactor addressing all 15 code review issues
- **Enhanced**: Better error handling, performance optimization, and code quality
- **Tested**: Comprehensive integration tests validate all improvements

### Contributing to Original Project

The original project is maintained by [jamubc](https://github.com/jamubc). See their [Contributing Guidelines](https://github.com/jamubc/gemini-mcp-tool/blob/main/CONTRIBUTING.md) for details.

### Contributing to This Fork

Issues and pull requests welcome at [maxanatsko/gemini-mcp-tool](https://github.com/maxanatsko/gemini-mcp-tool).

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

**Disclaimer:** This is an unofficial, third-party tool and is not affiliated with, endorsed, or sponsored by Google.
