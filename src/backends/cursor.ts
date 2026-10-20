import { Agent, Cursor, JsonlLocalAgentStore, type ModelSelection } from "../vendor/cursor-sdk";
import { mkdir, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildSystemPrompt } from "../writing-style";
import { Backend, FixRequest } from "./types";

const DEFAULT_MODEL = "claude-haiku-5-5";

/**
 * Hard-coded for now: Cursor model ids change often. Later, fill this from `Cursor.models.list()`.
 * Measured on the spike: Haiku and Luna ~3-5s, Composer 2.5 ~8-17s.
 */
const MODELS = [
  { title: "Claude Haiku 5.5 (fast)", value: "claude-haiku-5-5" },
  { title: "GPT-5.6 Luna (fast)", value: "gpt-5.6-luna" },
  { title: "Composer 2.5 (slower)", value: "composer-2.5" },
] as const;

/** Keep reasoning off. Parameter ids differ per model; unknown models get no params. */
const MODEL_PARAMS: Record<string, ModelSelection["params"]> = {
  "claude-haiku-5-5": [
    { id: "thinking", value: "false" },
    { id: "reasoning_effort", value: "low" },
  ],
  "gpt-5.6-luna": [{ id: "reasoning", value: "none" }],
};

let configured = false;

/** Corporate TLS proxies (Netskope) often break HTTP/2, so force HTTP/1.1 + SSE. Global and one-off. */
function configureSdk(): void {
  if (configured) return;
  Cursor.configure({ local: { useHttp1ForAgent: true } });
  configured = true;
}

async function prepareWorkspace(): Promise<{ cwd: string; store: JsonlLocalAgentStore }> {
  const root = await mkdtemp(join(tmpdir(), "quick-fix-"));
  const cwd = join(root, "work");
  const storeDir = join(root, "store");
  await Promise.all([mkdir(cwd), mkdir(storeDir)]);
  return { cwd, store: new JsonlLocalAgentStore(storeDir) };
}

async function fix({ text, apiKey, model, writingStyle }: FixRequest): Promise<string> {
  configureSdk();
  const id = model || DEFAULT_MODEL;
  const { cwd, store } = await prepareWorkspace();
  const prompt = `${buildSystemPrompt(writingStyle)}\nDo not use any tools or edit any files.\n\nText:\n${text}`;

  const result = await Agent.prompt(prompt, {
    apiKey,
    model: { id, params: MODEL_PARAMS[id] },
    local: { cwd, store },
  });

  if (result.status !== "finished") {
    throw new Error(result.error?.message ?? `Cursor run ${result.status}`);
  }
  const fixed = result.result?.trim();
  if (!fixed) {
    throw new Error("Empty response from Cursor");
  }
  return fixed;
}

export const cursorBackend: Backend = {
  id: "cursor",
  title: "Cursor",
  keyLabel: "Cursor API Key",
  keyPlaceholder: "Cursor Dashboard → Integrations",
  privacyNote: "Requests go to Cursor's API using an agent with no repo access.",
  defaultModel: DEFAULT_MODEL,
  models: MODELS,
  fix,
};
