# Quick Fix

Raycast extension: fix spelling & grammar on selected text with **your own OpenAI API key** (called directly — not via Raycast’s AI proxy).

## Setup

1. `npm install`
2. `npm run dev` (keeps Raycast in development mode; leave it running while iterating)
3. Raycast → **Configure** → paste API key, pick model, tweak tone of voice → Save
4. Optional: Extensions → Quick Fix → **Fix Spelling and Grammar** → Record Hotkey

Before publishing to the Raycast Store, set `"author"` in `package.json` to your Raycast username (must exist on raycast.com).

## Usage

1. Select text in any Mac app
2. Run **Fix Spelling and Grammar** (or your hotkey)
3. Corrected text replaces the selection

### Configure

Run **Configure** to set:

| Field | Notes |
|---|---|
| OpenAI API Key | Stored locally on this Mac |
| Model | Dropdown (`gpt-6-luna` default; also Sol / Terra) |
| Tone of voice | Rules applied on every fix; Reset restores the built-in default |

## Docs

- [MVP plan](docs/plan-mvp.md)

## License

MIT
