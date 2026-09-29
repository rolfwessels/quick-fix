import OpenAI from "openai";
import { DEFAULT_MODEL } from "./settings";
import { buildSystemPrompt } from "./writing-style";

export async function fixGrammar(text: string, apiKey: string, model: string, writingStyle: string): Promise<string> {
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

  const fixed = response.choices[0]?.message?.content?.trim();
  if (!fixed) {
    throw new Error("Empty response from OpenAI");
  }
  return fixed;
}
