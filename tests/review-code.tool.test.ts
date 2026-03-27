import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildReviewPrompt } from '../src/utils/reviewPromptBuilder.ts';

describe('buildReviewPrompt severity handling', () => {
  const baseConfig = {
    userPrompt: 'Review these changes',
    session: {
      sessionId: 'review-main-12345678',
      createdAt: 1,
      lastAccessedAt: 1,
      gitState: {
        branch: 'main',
        commitHash: '1234567890abcdef1234567890abcdef12345678',
        workingTreeClean: true,
        hasUncommittedChanges: false,
        timestamp: 1,
      },
      currentGitState: {
        branch: 'main',
        commitHash: '1234567890abcdef1234567890abcdef12345678',
        workingTreeClean: true,
        hasUncommittedChanges: false,
        timestamp: 1,
      },
      rounds: [],
      allComments: [],
      filesTracked: ['src/index.ts'],
      focusFiles: ['src/index.ts'],
      reviewScope: 'focused' as const,
      totalRounds: 0,
      sessionState: 'active' as const,
    },
    files: ['src/index.ts'],
    reviewType: 'general',
    includeHistory: false,
    currentGitState: {
      branch: 'main',
      commitHash: '1234567890abcdef1234567890abcdef12345678',
      workingTreeClean: true,
      hasUncommittedChanges: false,
      timestamp: 1,
    },
  };

  it('includes critical-only instructions in the prompt', () => {
    const prompt = buildReviewPrompt({
      ...baseConfig,
      severity: 'critical-only',
    });

    expect(prompt).toContain('Severity Scope: critical-only');
    expect(prompt).toContain('Only report **critical** issues.');
    expect(prompt).toContain('No critical issues found.');
  });

  it('includes important-and-above instructions in the prompt', () => {
    const prompt = buildReviewPrompt({
      ...baseConfig,
      severity: 'important-and-above',
    });

    expect(prompt).toContain('Severity Scope: important-and-above');
    expect(prompt).toContain('Only report **critical** and **important** issues.');
    expect(prompt).not.toContain('Only report **critical** issues.');
  });
});

describe('reviewCodeTool Gemini defaults', () => {
  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.restoreAllMocks();
    vi.unmock('../src/backends/index.js');
    vi.unmock('../src/utils/gitStateDetector.js');
    vi.unmock('../src/utils/reviewSessionManager.js');
    vi.unmock('../src/utils/reviewPromptBuilder.js');
    vi.unmock('../src/utils/reviewResponseParser.js');
    vi.unmock('../src/utils/reviewFormatter.js');
  });

  it('defaults Gemini reviews to flash when no model is provided', async () => {
    const executeMock = vi.fn().mockResolvedValue({
      response: 'No issues found.',
      backend: 'gemini',
    });

    vi.doMock('../src/utils/gitStateDetector.js', () => ({
      getCurrentGitState: vi.fn().mockResolvedValue({
        branch: 'main',
        commitHash: '1234567890abcdef1234567890abcdef12345678',
        workingTreeClean: true,
        hasUncommittedChanges: false,
        timestamp: 123,
      }),
      generateSessionId: vi.fn().mockReturnValue('review-main-12345678'),
      detectSessionContinuation: vi.fn().mockReturnValue({ canContinue: true }),
    }));

    vi.doMock('../src/backends/index.js', () => ({
      getBackend: vi.fn().mockResolvedValue({
        name: 'gemini',
        execute: executeMock,
      }),
    }));

    vi.doMock('../src/utils/reviewSessionManager.js', () => ({
      loadReviewSession: vi.fn().mockResolvedValue(null),
      saveReviewSession: vi.fn().mockResolvedValue(undefined),
      createNewSession: vi.fn((sessionId: string, currentGitState: any, files?: string[]) => ({
        sessionId,
        createdAt: 1,
        lastAccessedAt: 1,
        gitState: currentGitState,
        currentGitState,
        rounds: [],
        allComments: [],
        filesTracked: files ?? [],
        focusFiles: files,
        reviewScope: files ? 'focused' : 'full',
        totalRounds: 0,
        sessionState: 'active',
      })),
    }));

    vi.doMock('../src/utils/reviewPromptBuilder.js', () => ({
      buildReviewPrompt: vi.fn().mockReturnValue('review prompt'),
      extractFilesFromPrompt: vi.fn().mockReturnValue(['src/index.ts']),
    }));

    vi.doMock('../src/utils/reviewResponseParser.js', () => ({
      parseReviewResponse: vi.fn().mockReturnValue([]),
      validateComments: vi.fn((comments: unknown[]) => comments),
    }));

    vi.doMock('../src/utils/reviewFormatter.js', () => ({
      formatReviewResponse: vi.fn().mockReturnValue('FORMATTED_REVIEW'),
      formatSessionNotFound: vi.fn().mockReturnValue('SESSION_NOT_FOUND'),
      formatGitStateWarning: vi.fn().mockReturnValue('GIT_WARNING'),
    }));

    const { reviewCodeTool } = await import('../src/tools/review-code.tool.ts');

    const result = await reviewCodeTool.execute({
      prompt: 'Short review',
      backend: 'gemini',
      files: ['src/index.ts'],
      includeHistory: false,
      reviewType: 'general',
      severity: 'all',
    });

    expect(result).toBe('FORMATTED_REVIEW');
    expect(executeMock).toHaveBeenCalledTimes(1);
    expect(executeMock.mock.calls[0][1]).toMatchObject({
      provider: 'gemini',
      model: 'gemini-2.5-flash',
    });
  });
});
