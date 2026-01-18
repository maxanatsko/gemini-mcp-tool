import { z } from 'zod';
import { UnifiedTool } from './registry.js';
import { getBackend, BackendType } from '../backends/index.js';
import { processChangeModeOutput } from '../utils/geminiExecutor.js';
import {
  ERROR_MESSAGES,
  STATUS_MESSAGES,
  MODELS
} from '../constants.js';
import { askGeminiSessionManager } from '../utils/askGeminiSessionManager.js';
import { extractFilesFromPrompt } from '../utils/reviewPromptBuilder.js';
import { Logger } from '../utils/logger.js';

const askArgsSchema = z.object({
  prompt: z.string().min(1).describe("Analysis request. Use @ syntax to include files (e.g., '@largefile.js explain what this does') or ask general questions"),
  backend: z.enum(['gemini', 'codex']).optional().describe("AI backend to use: 'gemini' (default) or 'codex'. Gemini offers 1M+ token context, Codex integrates with OpenAI models."),
  session: z.string().optional().describe("Session ID for conversation continuity (e.g., 'typescript-learning'). Maintains context across multiple questions."),
  model: z.string().optional().describe("Model override. Gemini: 'gemini-3-pro-preview' (default), 'gemini-2.5-pro', 'gemini-2.5-flash'. Codex: 'o4-mini', 'o3', 'gpt-4.1'"),
  sandbox: z.boolean().default(false).describe("Use sandbox mode to safely test code changes or run potentially risky operations in an isolated environment"),
  changeMode: z.boolean().default(false).describe("Enable structured change mode - formats prompts to prevent tool errors and returns structured edit suggestions that Claude can apply directly"),
  includeHistory: z.boolean().default(true).describe("Include conversation history in context (only applies when session is provided). Default: true"),
  allowedTools: z.array(z.string()).optional().describe("Tools that the AI can auto-approve without confirmation (e.g., ['run_shell_command'] for git commands). Use sparingly for security."),
  cwd: z.string().optional().describe("Working directory for CLI execution. Use this to match your IDE workspace directory if you get 'Directory mismatch' errors."),
});

export const askTool: UnifiedTool = {
  name: "ask",
  description: "Query AI with file analysis, session continuity, and dual-backend support (Gemini/Codex). Use backend:'codex' for OpenAI, defaults to Gemini.",
  zodSchema: askArgsSchema,
  prompt: {
    description: "Execute AI query with optional file references, session management, and backend selection.",
  },
  category: 'gemini',
  execute: async (args, onProgress) => {
    const {
      prompt,
      backend: backendChoice,
      session,
      model,
      sandbox,
      changeMode,
      includeHistory,
      allowedTools,
      cwd
    } = args;

    if (!prompt?.trim()) {
      throw new Error(ERROR_MESSAGES.NO_PROMPT_PROVIDED);
    }

    // Get the appropriate backend (defaults to Gemini)
    const backendType = (backendChoice as BackendType) || 'gemini';
    const backend = await getBackend(backendType);

    onProgress?.(`🤖 Using ${backend.name} backend...`);

    // Session handling
    let sessionData = null;
    let enhancedPrompt = prompt as string;

    if (session) {
      try {
        sessionData = await askGeminiSessionManager.getOrCreate(session as string);

        // Build conversation context if history is enabled
        if (includeHistory && sessionData.conversationHistory.length > 0) {
          const historyContext = askGeminiSessionManager.buildConversationContext(sessionData, 3);
          enhancedPrompt = `${historyContext}\n\n# Current Question\n${prompt}`;
        }

        onProgress?.(`📝 Session '${session}' (Round ${sessionData.totalRounds + 1})`);
      } catch (error) {
        onProgress?.(`⚠️  Session loading failed: ${error instanceof Error ? error.message : String(error)}`);
        Logger.error(`Failed to load session '${session}': ${error}`);
        // Continue without session
      }
    }

    // Execute via the selected backend
    const result = await backend.execute(
      enhancedPrompt,
      {
        provider: backendType,
        model: model as string | undefined,
        sandbox: !!sandbox,
        changeMode: !!changeMode,
        allowedTools: allowedTools as string[] | undefined,
        cwd: cwd as string | undefined,
      },
      onProgress
    );

    // Save to session if provided
    if (session && sessionData) {
      try {
        const contextFiles = extractFilesFromPrompt(prompt as string);
        const usedModel = model ? (model as string) : MODELS.PRO_3;
        askGeminiSessionManager.addRound(
          sessionData,
          prompt as string,
          result,
          usedModel,
          contextFiles
        );
        await askGeminiSessionManager.save(sessionData);
        onProgress?.(`💾 Saved to session '${session}' (${sessionData.totalRounds} rounds)`);
      } catch (error) {
        onProgress?.(`⚠️  Session save failed: ${error instanceof Error ? error.message : String(error)}`);
        Logger.error(`Failed to save session '${session}': ${error}`);
        // Continue - result is still valid even if session save failed
      }
    }

    if (changeMode) {
      return processChangeModeOutput(result);
    }

    // Use backend-aware response prefix
    const backendName = backend.name.charAt(0).toUpperCase() + backend.name.slice(1);
    return `${backendName} response:\n${result}`;
  }
};

// Backward compatibility: Export askGeminiTool as an alias
export const askGeminiTool = askTool;
