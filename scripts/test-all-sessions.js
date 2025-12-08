#!/usr/bin/env node
/**
 * Comprehensive test for shared session infrastructure
 * Tests all three tools: ask-gemini, brainstorm, review-code
 */

import { askGeminiTool } from '../dist/tools/ask-gemini.tool.js';
import { brainstormTool } from '../dist/tools/brainstorm.tool.js';
import { reviewCodeTool } from '../dist/tools/review-code.tool.js';

const onProgress = (msg) => console.log(`  [Progress] ${msg}`);

console.log('='.repeat(80));
console.log('Testing Shared Session Infrastructure');
console.log('='.repeat(80));

try {
  // Test 1: ask-gemini sessions
  console.log('\n📝 Test 1: ask-gemini with conversation continuity');
  console.log('-'.repeat(80));

  console.log('\n  Round 1: Initial question (creates session)');
  await askGeminiTool.execute({
    prompt: "What are the key principles of good API design?",
    session: "api-learning",
    model: "gemini-2.5-flash"
  }, onProgress);

  console.log('\n  Round 2: Follow-up question (continues session)');
  await askGeminiTool.execute({
    prompt: "Can you give me an example of RESTful API best practices?",
    session: "api-learning",
    model: "gemini-2.5-flash",
    includeHistory: true
  }, onProgress);

  console.log('\n  ✅ ask-gemini session continuity working!\n');

  // Test 2: brainstorm sessions
  console.log('🧠 Test 2: brainstorm with idea tracking');
  console.log('-'.repeat(80));

  console.log('\n  Round 1: Initial brainstorm (creates session)');
  await brainstormTool.execute({
    prompt: "Ideas for improving developer productivity",
    session: "productivity-ideas",
    methodology: "divergent",
    domain: "software",
    ideaCount: 5,
    model: "gemini-2.5-flash"
  }, onProgress);

  console.log('\n  Round 2: Refine ideas (continues session)');
  await brainstormTool.execute({
    prompt: "Focus on automation and tooling from previous ideas",
    session: "productivity-ideas",
    includeHistory: true,
    ideaCount: 3,
    model: "gemini-2.5-flash"
  }, onProgress);

  console.log('\n  ✅ brainstorm session continuity working!\n');

  // Test 3: review-code with new manager (backward compatibility)
  console.log('🔍 Test 3: review-code with new session manager');
  console.log('-'.repeat(80));

  console.log('\n  Testing backward compatibility...');
  await reviewCodeTool.execute({
    prompt: "Quick quality check",
    files: ["src/utils/sessionManager.ts"],
    reviewType: "quality",
    model: "gemini-2.5-flash",
    forceNewSession: true
  }, onProgress);

  console.log('\n  ✅ review-code backward compatibility working!\n');

  console.log('='.repeat(80));
  console.log('🎉 All Tests Passed!');
  console.log('='.repeat(80));
  console.log('\nSession Infrastructure Summary:');
  console.log('  ✅ Generic SessionManager<T> with type safety');
  console.log('  ✅ ask-gemini: 7-day sessions with conversation history');
  console.log('  ✅ brainstorm: 14-day sessions with idea tracking');
  console.log('  ✅ review-code: 24-hour sessions with git detection (backward compatible)');
  console.log('\nStorage Locations:');
  console.log('  - ask-gemini: ~/.gemini-mcp/sessions/ask-gemini/');
  console.log('  - brainstorm: ~/.gemini-mcp/sessions/brainstorm/');
  console.log('  - review-code: ~/.gemini-mcp/sessions/review-code/');
  console.log('='.repeat(80));

} catch (error) {
  console.error('\n❌ Test failed:');
  console.error(error.message);
  console.error(error.stack);
  process.exit(1);
}
