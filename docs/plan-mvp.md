# Quick Fix — MVP Plan

Open-source Raycast extension: select text → fix grammar/spelling → paste back, with **bring your own key** (direct to provider, no Raycast proxy).

Working name: `quick-fix`  
Location: `~/personal/quick-fix`  
Stack: TypeScript + React + Node (`@raycast/api`)

---

## Why

| Pain | Response |
|---|---|
| Raycast Quick Fix / AI Commands feel paywalled | Community extension, free |
| BYOK still routes through Raycast servers | Call OpenAI (etc.) **from the extension** |
| Want the daily grammar hotkey back | One command + assigned Raycast hotkey |

Not a goal for MVP: pixel-match Pro’s double-tap Right Shift / Accessibility field replace / format preserve.

---

## MVP scope (ship this)

| # | Feature | Notes |
|---|---|---|
| 1 | **Fix Spelling & Grammar** command | Single command; selected text in → corrected text out |
| 2 | **BYOK OpenAI** | Preference: API key (password), model (default `gpt-4o-mini`) |
| 3 | **Select → replace** | `getSelectedText()` → API → `Clipboard.paste()` |
| 4 | **HUD / toast** | Success / empty selection / API error |
| 5 | **Hotkey-friendly** | Document: Extensions → Quick Fix → Assign Hotkey |
| 6 | **MIT license** | Clear for Store + GitHub |

### Out of MVP

- Double-tap modifier / zero Raycast chrome
- Preserve rich formatting (Slack/Notion)
- Diff “what changed” UI
- Multi-provider (Anthropic, OpenRouter, Ollama)
- Tone / improve-writing / translate suite
- Streaming token HUD
- Raycast Store publish (local `npm run dev` first)

---

## How it works (flow)

```
[Any Mac app]
    select text
         │
         ▼
[Raycast hotkey] ──► Fix Spelling & Grammar
         │
         ├─ getSelectedText()
         ├─ POST OpenAI chat.completions (user key)
         │     system: "Fix spelling and grammar only. Preserve meaning, tone, language."
         └─ Clipboard.paste(result)
```

### Prompt sketch (iterate later)

```
You are a careful copy editor.
Fix spelling, grammar, and punctuation only.
Do not change meaning, tone, or language.
Do not add quotes, explanations, or markdown.
Return only the corrected text.
```

---

## Preferences (MVP)

| Key | Type | Required | Default |
|---|---|---|---|
| `openaiApiKey` | password | yes | — |
| `model` | dropdown / text | no | `gpt-4o-mini` |

---

## Project layout (target)

```
quick-fix/
  docs/
    plan-mvp.md          ← this file
  package.json
  tsconfig.json
  README.md
  src/
    fix-grammar.tsx                 ← main command
    configure.tsx                   ← API key, model, tone of voice
    settings.ts                     ← LocalStorage load/save
    writing-style.ts                ← default rules + prompt builder
    openai.ts                       ← thin API client
    selection.ts                    ← clipboard-safe selection read
```

Scaffold via Raycast **Create Extension** (or hand-roll `package.json` + `@raycast/api`).

---

## Risks & open questions

| Risk | Mitigation |
|---|---|
| `getSelectedText()` clobbers clipboard | Save/restore clipboard around the call |
| Some apps reject Accessibility / selection | Toast: “Select text first”; fallback note in README |
| Hotkey still flashes Raycast | Accept for MVP; native app later if it matters |
| Name collision on Store | Check Store before publish; rename if needed |
| Fork vs build | Existing: Refine, GrammariX, WordingKit — build thin MVP first |

### Decisions (locked for MVP)

| # | Question | Decision |
|---|---|---|
| 1 | Provider | OpenAI-only for v0 |
| 2 | Output | Always replace selection via paste |
| 3 | Name | Keep `quick-fix` |

---

## Build sequence

| Step | Done when | Status |
|---|---|---|
| A. Scaffold extension + README | `npm run dev` loads command in Raycast | done (`npm run build` / `ray develop` ok) |
| B. Prefs for key + model | Configure command stores key/model/tone | done |
| C. Wire OpenAI + paste-back | Select → hotkey → corrected text in Slack/Notes | done (code) — **you verify in Raycast** |
| D. Clipboard save/restore | Existing clipboard survives a fix | done (`selection.ts`) |
| E. Polish errors + README hotkey | Friend can clone and use in <10 min | done (README) |

---

## Later (post-MVP)

- Anthropic / OpenRouter / Ollama providers
- Command suite: Improve Writing, Change Tone, Shorten
- Detail view with before/after diff
- Optional: standalone Mac app for true Quick Fix UX
- Publish to Raycast Store

---

## References

- [Create Extension](https://developers.raycast.com/basics/create-your-first-extension)
- [getSelectedText / Clipboard](https://developers.raycast.com/api-reference/environment)
- [Raycast BYOK (for contrast)](https://manual.raycast.com/ai/bring-your-own-keys)
- Prior art: [Refine](https://github.com/jibin2706/refine), [WordingKit](https://github.com/suregoodru/wordingkit)
