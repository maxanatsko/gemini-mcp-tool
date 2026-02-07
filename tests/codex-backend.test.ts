import { describe, expect, it } from 'vitest';
import { CodexBackend } from '../src/backends/codex.ts';

describe('CodexBackend command args', () => {
  it('keeps global flags before exec and maps reasoning effort to --config', () => {
    const backend = new CodexBackend();
    const args = (backend as any).buildArgs({
      provider: 'codex',
      model: 'gpt-5.3-codex',
      approvalMode: 'on-request',
      sandboxMode: 'workspace-write',
      reasoningEffort: 'high',
    });

    const execIndex = args.indexOf('exec');
    const approvalIndex = args.indexOf('-a');
    const sandboxIndex = args.indexOf('-s');
    const configIndex = args.indexOf('--config');

    expect(execIndex).toBeGreaterThan(-1);
    expect(approvalIndex).toBeGreaterThan(-1);
    expect(sandboxIndex).toBeGreaterThan(-1);
    expect(configIndex).toBeGreaterThan(-1);

    expect(approvalIndex).toBeLessThan(execIndex);
    expect(sandboxIndex).toBeLessThan(execIndex);
    expect(configIndex).toBeLessThan(execIndex);

    expect(args).toContain('model_reasoning_effort="high"');
    expect(args).toContain('--json');
    expect(args).toContain('-');
  });

  it('uses exec resume when codexThreadId is provided', () => {
    const backend = new CodexBackend();
    const threadId = '019c3757-792b-71a0-aff8-4ac94c1cde2f';
    const args = (backend as any).buildArgs({
      provider: 'codex',
      codexThreadId: threadId,
      sandboxMode: 'read-only',
    });

    const execIndex = args.indexOf('exec');
    const resumeIndex = args.indexOf('resume');

    expect(execIndex).toBeGreaterThan(-1);
    expect(resumeIndex).toBe(execIndex + 1);
    expect(args[resumeIndex + 1]).toBe(threadId);
  });
});

describe('CodexBackend JSON parsing', () => {
  it('parses item.completed agent messages and thread id', () => {
    const backend = new CodexBackend();
    const jsonl = [
      '{"type":"thread.started","thread_id":"thread-123"}',
      '{"type":"item.completed","item":{"id":"a","type":"agent_message","text":"FIRST_OK"}}',
      '{"type":"item.completed","item":{"id":"b","type":"reasoning","text":"ignore"}}',
      '{"type":"item.completed","item":{"id":"c","type":"agent_message","text":"SECOND_OK"}}',
    ].join('\n');

    const parsed = (backend as any).parseJsonOutput(jsonl);
    expect(parsed.threadId).toBe('thread-123');
    expect(parsed.response).toBe('FIRST_OK\nSECOND_OK');
  });
});
