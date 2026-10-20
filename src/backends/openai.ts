import OpenAI from "openai";
import { buildSystemPrompt } from "../writing-style";
import { Backend, FixRequest } from "./types";

const DEFAULT_MODEL = "gpt-6-luna";

/** Current OpenAI flagship text models (https://platform.openai.com/docs/models). */
const MODELS = [
  { title: "GPT-6 Luna (fast, cheap)", value: "gpt-6-luna" },
  { title: "GPT-6 Sol (balanced)", value: "gpt-6-sol" },
  { title: "GPT-5.6 Terra (balanced, mid-tier)", value: "gpt-5.6-terra" },
] as const;

async function fix({ text, apiKey, model, writingStyle, timer }: FixRequest): Promise<string> {
  const client = new OpenAI({ apiKey });
  const response = await client.chat.completions.create({
    model: model || DEFAULT_MODEL,
    messages: [
      { role: "system", content: buildSystemPrompt(writingStyle) },
      { role: "user", content: text },
    ],
    // GPT-6 chat completions: keep reasoning light for fast grammar fixes.
    reasoning_effort: "none",
  });

  timer?.lap("api-call");
  const fixed = response.choices[0]?.message?.content?.trim();
  if (!fixed) {
    throw new Error("Empty response from OpenAI");
  }
  return fixed;
}

export const openaiBackend: Backend = {
  id: "openai",
  title: "OpenAI",
  keyLabel: "OpenAI API Key",
  keyPlaceholder: "sk-…",
  privacyNote: "Requests go straight to OpenAI.",
  defaultModel: DEFAULT_MODEL,
  models: MODELS,
  fix,
};
