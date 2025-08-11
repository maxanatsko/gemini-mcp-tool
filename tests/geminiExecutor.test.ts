import { describe, it, afterEach, expect, vi } from 'vitest';
import { spawn } from 'child_process';
import { executeGeminiCLI } from '../src/utils/geminiExecutor.js';

vi.mock('child_process', () => ({
  spawn: vi.fn(),
}));

describe('executeGeminiCLI', () => {
  const originalPlatform = process.platform;

  afterEach(() => {
    vi.resetAllMocks();
    Object.defineProperty(process, 'platform', { value: originalPlatform });
  });

  it('quotes prompt on win32 with -p for simple prompts', async () => {
    Object.defineProperty(process, 'platform', { value: 'win32' });
    const mockStdoutOn = vi.fn();
    const mockStderrOn = vi.fn();
    const mockWrite = vi.fn();
    const mockEnd = vi.fn();
    let closeCallback: (code: number) => void = () => {};
    const mockOn = vi.fn((event: string, cb: (code: number) => void) => {
      if (event === 'close') {
        closeCallback = cb;
      }
    });
    (spawn as unknown as vi.Mock).mockReturnValue({
      stdin: { write: mockWrite, end: mockEnd },
      stdout: { on: mockStdoutOn },
      stderr: { on: mockStderrOn },
      on: mockOn,
    });

    const prompt = 'Perfect! I\'ve said "fixed bug"';
    const promise = executeGeminiCLI(prompt);
    closeCallback(0);
    await promise;

    const spawnCall = (spawn as unknown as vi.Mock).mock.calls[0];
    const args = spawnCall[1] as string[];
    const stdio = spawnCall[2].stdio;
    const promptArgIndex = args.indexOf('-p') + 1;
    expect(args[promptArgIndex]).toBe(`"${prompt.replace(/"/g, '""')}"`);
    expect(stdio).toEqual(['ignore', 'pipe', 'pipe']);
    expect(mockWrite).not.toHaveBeenCalled();
    expect(mockEnd).not.toHaveBeenCalled();
  });

  it('uses stdin for complex prompts with @ on win32', async () => {
    Object.defineProperty(process, 'platform', { value: 'win32' });
    const mockStdoutOn = vi.fn();
    const mockStderrOn = vi.fn();
    const mockWrite = vi.fn();
    const mockEnd = vi.fn();
    let closeCallback: (code: number) => void = () => {};
    const mockOn = vi.fn((event: string, cb: (code: number) => void) => {
      if (event === 'close') {
        closeCallback = cb;
      }
    });
    (spawn as unknown as vi.Mock).mockReturnValue({
      stdin: { write: mockWrite, end: mockEnd },
      stdout: { on: mockStdoutOn },
      stderr: { on: mockStderrOn },
      on: mockOn,
    });

    const prompt = 'Analyze @src/file.ts and say "fix"';
    const promise = executeGeminiCLI(prompt);
    closeCallback(0);
    await promise;

    const spawnCall = (spawn as unknown as vi.Mock).mock.calls[0];
    const args = spawnCall[1] as string[];
    const stdio = spawnCall[2].stdio;
    expect(args).not.toContain('-p');
    expect(stdio).toEqual(['pipe', 'pipe', 'pipe']);
    expect(mockWrite).toHaveBeenCalledWith(prompt);
    expect(mockEnd).toHaveBeenCalled();
  });

  it('uses stdin for changeMode prompts', async () => {
    Object.defineProperty(process, 'platform', { value: 'win32' });
    const mockStdoutOn = vi.fn();
    const mockStderrOn = vi.fn();
    const mockWrite = vi.fn();
    const mockEnd = vi.fn();
    let closeCallback: (code: number) => void = () => {};
    const mockOn = vi.fn((event: string, cb: (code: number) => void) => {
      if (event === 'close') {
        closeCallback = cb;
      }
    });
    (spawn as unknown as vi.Mock).mockReturnValue({
      stdin: { write: mockWrite, end: mockEnd },
      stdout: { on: mockStdoutOn },
      stderr: { on: mockStderrOn },
      on: mockOn,
    });

    const prompt = 'Debug this';
    const promise = executeGeminiCLI(prompt, undefined, undefined, true);
    closeCallback(0);
    await promise;

    const spawnCall = (spawn as unknown as vi.Mock).mock.calls[0];
    const args = spawnCall[1] as string[];
    const stdio = spawnCall[2].stdio;
    expect(args).not.toContain('-p');
    expect(stdio).toEqual(['pipe', 'pipe', 'pipe']);
    expect(mockWrite.mock.calls[0][0]).toContain('[CHANGEMODE INSTRUCTIONS]');
    expect(mockWrite.mock.calls[0][0]).toContain('USER REQUEST:\nDebug this');
    expect(mockEnd).toHaveBeenCalled();
  });
});
