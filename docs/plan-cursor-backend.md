# Plan: pluggable backend, add Cursor

Goal: pick the backend (OpenAI or Cursor) in Configure, so Quick Fix works where OpenAI is blocked.

## How Cursor can be reached

Cursor has no plain chat-completions endpoint. Every route goes through an agent.

| Option | What it is | For | Against |
|---|---|---|---|
| A. `@cursor/sdk`, local agent | `Agent.prompt()` in-process, `local.cwd` = empty temp dir | One dependency, no repo, key never leaves the Cursor API | Needs Node >= 22.13, ships native per-platform binaries, writes run state to disk (SQLite via `node:sqlite`, or JSONL store), unknown fit inside Raycast's bundled runtime |
| B. Cloud Agents REST API | `POST /v1/agents` with no `repos` (no-repo agent), `GET /v1/models`, Basic or Bearer auth | Plain `fetch`, no native deps, official model list endpoint | Spins up a VM, likely several seconds per fix, must poll for the result |
| C. Spawn the `cursor-agent` CLI | `child_process` | Simple | Requires the CLI installed and logged in, not BYOK |

Recommendation: spike A first. It is the least code and the SDK is the documented path. Fall back to B if the SDK will not load in Raycast or latency is too high. Both fit behind the same interface (below), so the choice is isolated to one file.

Open questions for the spike (answer before building):
1. Does `@cursor/sdk` load and run inside a Raycast extension (Node version, native binaries, `node:sqlite`)? If the store fails, use `JsonlLocalAgentStore` via `local.store`.
2. Round-trip time for a one-sentence fix with `composer-2.5` vs `auto`. A hotkey grammar fix needs to feel quick, so more than about 5s is a problem.
3. Can the agent be kept from using tools or touching files? Use an empty temp `cwd` and a prompt that says "return only the corrected text" and check it never edits anything. Read `result.result` for the output.
4. Does the user API key (from Cursor Dashboard, Integrations) work for this, or does it need a service-account key?

## Design

New seam: a `Backend` with one method.

```ts
// src/backends/types.ts
export interface FixRequest { text: string; apiKey: string; model: string; writingStyle: string }
export interface Backend {
  id: "openai" | "cursor";
  title: string;
  defaultModel: string;
  models: { title: string; value: string }[]; // hard-coded for now
  fix(req: FixRequest): Promise<string>;
}
```

File changes:

| File | Change |
|---|---|
| `src/backends/types.ts` | New. Interface above |
| `src/backends/openai.ts` | Move current `src/openai.ts` here, implement `Backend` (logic unchanged) |
| `src/backends/cursor.ts` | New. `fix()` calls `Agent.prompt()` with `buildSystemPrompt(writingStyle)` + text, empty temp cwd, returns `result.result.trim()`. Maps `CursorAgentError` (never started) and `status === "error"` (ran and failed) to clear messages |
| `src/backends/index.ts` | New. Registry: `BACKENDS`, `getBackend(id)` |
| `src/settings.ts` | Add `backend`. Store one API key per backend (`openaiApiKey`, `cursorApiKey`) so switching does not lose a key. Store model per backend. `resolveModel` validates against the selected backend's list |
| `src/configure.tsx` | Backend dropdown. API key field label, placeholder and model list follow the selection |
| `src/fix-grammar.tsx` | Use `getBackend(settings.backend).fix(...)`. Missing-key toast names the backend |
| `package.json` | Add `@cursor/sdk`. Check Raycast `ray lint` and `ray build` accept it |
| `README.md`, `docs/plan-mvp.md` | Document backends, drop "multi-provider" from out of scope |

Settings migration: existing users have `openaiApiKey` and `model` in `LocalStorage`. Missing `backend` defaults to `openai`, so nothing breaks.

## Models (hard-coded for now)

Cursor list in `backends/cursor.ts`, starting with `composer-2.5` (SDK default), `auto`, plus whatever the spike shows is fast. Keep it in one array so it is a one-line edit.

Later (not in this change): replace the array with `Cursor.models.list()` (SDK) or `GET /v1/models` (REST), cached in `LocalStorage` with a TTL and the hard-coded list as fallback. The docs say ids and params change, so the `models` field on `Backend` should become `listModels(apiKey)` at that point. Do not build it yet, but keep the dropdown reading from one function so the swap is small.

## Steps

1. Spike A in a scratch script: `Agent.prompt()` with a sample paragraph, measure time, confirm no file edits. Decide A or B.
2. Extract the `Backend` interface and move OpenAI behind it (no behaviour change, manual check).
3. Add the Cursor backend and registry.
4. Settings and Configure changes, including migration.
5. Manual test in Raycast: both backends, missing key, wrong key, switching back and forth.
6. README update.

## Risks

- Latency may make the Cursor backend noticeably slower than OpenAI. Mitigation: pick the fastest model after the spike, and say so in the README.
- Agent output may include extra prose or tool use. Mitigation: strict prompt, and fail loudly rather than paste junk over the user's selection.
- SDK is in public beta, so its API may shift. Isolated to `backends/cursor.ts`.
- Pasting the corrected text replaces the selection, so a bad response is destructive. Consider keeping the original on the clipboard history (Raycast's history already does).

## Spike results (2026-10-20)

Scratch scripts were in `/tmp/qf-spike` (not in the repo). Key is in Keychain as `cursor-api-token`. Read it inline with `security find-generic-password -a "$USER" -s cursor-api-token -w`, never print it.

| Check | Result |
|---|---|
| `Cursor.models.list()` | Works. The key is valid. Ids seen: `composer-2.5`, `auto-smart`, `default`, `gpt-5.6-luna`, `claude-haiku-5-5`, `gemini-3.8-flash`, `grok-4.7` and more |
| `Agent.prompt()` / `Agent.create()` + `send()`, local agent, empty temp cwd | Fails after 15-18s: `[unknown] [unavailable] expected h2 session, but ALPN protocol failed to negotiate`. Same for `composer-2.5` and `auto`. Nothing written to the cwd |
| `POST https://api.cursor.com/v1/agents` (no repo, Bearer auth) | `403 feature_unavailable [unauthenticated]` in under 1s. Cloud agents may not be enabled for this key or team |

Notes:
- `auto` is not a valid model id. Use `auto-smart` or `default`.
- The user suspects the HTTP/2 failure is a local problem (new, laptop may need a restart), not a permanent block. Unconfirmed. Could also be a corporate proxy or TLS inspection.
- Node on this machine: v26.3.1. SDK installed fine with `npm i @cursor/sdk`.

### Next steps

1. Restart the laptop, then re-run the local SDK spike (`node spike.mjs composer-2.5 default`). If the h2 error is gone, record latency per model and whether the agent stays tool-free.
2. If it still fails, test from a network without the corporate proxy (for example a phone hotspot) to separate proxy from machine.
3. For the 403 on the REST route, ask whether cloud agents are enabled for the account or team. Only needed if the local SDK route is not viable.
4. If Cursor is not viable, the `Backend` interface still pays off: add another approved provider behind it.
5. Once a route works, build per the Steps section above.

## Update: HTTP/2 workaround found (2026-10-20)

Cause of the h2/ALPN error: Netskope (`ca.impact.goskope.com`) intercepts TLS to `api2.cursor.sh` and does not negotiate HTTP/2. A restart does not help.

Fix: call this once before creating any agent. It makes the SDK use HTTP/1.1 + SSE.

```ts
Cursor.configure({ local: { useHttp1ForAgent: true } });
```

Note it is a global setting. Passing `useHttp1ForAgent` inside `Agent.prompt({ local })` did NOT work.

Local SDK route now works with an empty temp cwd, no files written, output was only the corrected text:

| Model | Time |
|---|---|
| `composer-2.5` | ~14s |
| `gpt-5.6-luna` | ~5.4s |
| `claude-haiku-5-5` | ~4.0s |

Decisions:
- Go with option A (`@cursor/sdk` local agent). Always set `useHttp1ForAgent: true` (harmless off the proxy).
- Default Cursor model: `claude-haiku-5-5`, then `gpt-5.6-luna`. Avoid `composer-2.5` (too slow for a hotkey).
- Still to check: that it loads inside Raycast's runtime (Node version, native binaries, SQLite store; fall back to `JsonlLocalAgentStore`).
