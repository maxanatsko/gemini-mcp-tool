// Tool Registry Index - Registers all tools
import { toolRegistry } from './registry.js';
import { askTool, askGeminiTool } from './ask.tool.js';
import { brainstormTool } from './brainstorm.tool.js';
import { timeoutTestTool } from './timeout-test.tool.js';
import { reviewCodeTool } from './review-code.tool.js';

// Register tools
// askTool is the new name, askGeminiTool is an alias for backward compatibility
toolRegistry.push(
  askTool,
  brainstormTool,
  timeoutTestTool,
  reviewCodeTool
);

export * from './registry.js';

// Re-export tools for direct access
export { askTool, askGeminiTool } from './ask.tool.js';
export { brainstormTool } from './brainstorm.tool.js';
export { reviewCodeTool } from './review-code.tool.js';