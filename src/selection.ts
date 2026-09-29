import { Clipboard, getSelectedText } from "@raycast/api";

/** Reads the frontmost selection without permanently clobbering the clipboard. */
export async function readSelectedText(): Promise<string> {
  const previous = await Clipboard.read();
  try {
    return await getSelectedText();
  } finally {
    await restoreClipboard(previous);
  }
}

async function restoreClipboard(previous: Clipboard.ReadContent): Promise<void> {
  try {
    if (previous.file) {
      await Clipboard.copy({ file: previous.file });
      return;
    }
    if (previous.html) {
      await Clipboard.copy({ html: previous.html, text: previous.text });
      return;
    }
    await Clipboard.copy(previous.text);
  } catch {
    // Best-effort restore; some clipboard payloads cannot be rewritten.
  }
}
