# AGENTS

**Project workflows**
- Build: `npm run build` (cleans `dist/`, runs `tsc`, chmods `dist/index.js`).
- Run (prod): `npm run start` (executes `node dist/index.js`).
- Run (dev): `npm run dev` (build then run `dist/index.js`).
- Tests: `npm run test` (Vitest run), `npm run test:watch`, and `npm run test -- tests/codex-backend.test.ts` for Codex backend regressions.
- Typecheck: `npm run lint` (`tsc --noEmit`).
- Docs: `npm run docs:dev`, `npm run docs:build`, `npm run docs:preview` (VitePress).

**Maintenance scripts**
- Wiki deploy: `./scripts/deploy-wiki.sh` (requires `wiki-enhanced.md` at repo root and `gh` installed; pushes to the GitHub wiki).
- Session integration test: `node ./scripts/test-all-sessions.js` (expects `dist/` to be built first).

**Guardrails from recent commits**
- Tool registry source of truth is `src/tools/index.ts`; keep only stable/public tools registered. Do not leave deprecated aliases (for example `ask-gemini`) or test-only tools (for example `timeout-test`) in the registry.
- For Codex CLI execution, place global flags (`-m`, `-a`, `-s`, `--config`) before `exec`; resume flows use `codex exec resume <threadId>`.
- For Codex reasoning effort, use `--config model_reasoning_effort="<level>"` (not `--reasoning-effort`).
- Codex JSON parsing must include `item.completed` events with nested `agent_message` payloads, not only legacy event shapes.
- Sessions are stored under `~/.ai-cli-mcp/sessions/<tool-name>/`; keep legacy read compatibility from `~/.gemini-mcp/sessions/<tool-name>/` during migration.
