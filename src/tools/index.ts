// Tool Registry Index - Registers all tools
import { toolRegistry } from './registry.js';
import { askGeminiTool } from './ask-gemini.tool.js';
import { brainstormTool } from './brainstorm.tool.js';
import { timeoutTestTool } from './timeout-test.tool.js';
import { reviewCodeTool } from './review-code.tool.js';

toolRegistry.push(
  askGeminiTool,
  brainstormTool,
  timeoutTestTool,
  reviewCodeTool
);

export * from './registry.js';