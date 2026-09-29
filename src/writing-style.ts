/** Default voice rules. Edit via Configure. */
export const DEFAULT_WRITING_STYLE = `Write like a real person, not a chatbot.

Punctuation and phrasing:
- No em dashes or double hyphens. Use a comma, full stop, parentheses, or rewrite.
- Avoid AI-tell words and filler (delve, it's worth noting, in today's fast-paced world, I hope this helps, navigate the landscape, tapestry, testament to).
- Avoid the intensifier "exactly" (e.g. "that's exactly what…"). State the thing plainly.
- No throat-clearing openers (Here's where we land, Here's the thing, At the end of the day, To be honest, Long story short). Start with the point.
- No empty approval closers (That's the right shape, That works, That's the move, Just say the word). State the substance and stop.
- Avoid over-hedging and stock transitions (Furthermore, Moreover, That said as a crutch).
- No emoji unless the original text already used them.

Slack / pasteable text:
- Prefer plain sentences. Use line breaks, plain dashes for bullets, and numbered lists for structure.
- Do not wrap words in markdown bold or add markdown headings unless the original already had them.

Keep the author's meaning. Prefer light edits over rewrites. "~" for approximately is fine.`;

const STORAGE_KEY = "writingStyle";

export async function loadWritingStyle(getItem: (key: string) => Promise<string | undefined>): Promise<string> {
  const stored = await getItem(STORAGE_KEY);
  if (stored === undefined || stored === null) {
    return DEFAULT_WRITING_STYLE;
  }
  return stored;
}

export async function saveWritingStyle(
  setItem: (key: string, value: string) => Promise<void>,
  value: string,
): Promise<void> {
  await setItem(STORAGE_KEY, value);
}

export function buildSystemPrompt(writingStyle: string): string {
  const style = writingStyle.trim();
  const base = [
    "You are a careful copy editor.",
    "Fix spelling, grammar, and punctuation.",
    "Preserve meaning and language.",
    "Do not add quotes, explanations, or markdown fences.",
    "Return only the corrected text.",
  ].join(" ");

  if (!style) {
    return base;
  }

  return `${base}\n\nVoice and style rules (follow these so the result sounds human, not AI):\n${style}`;
}
