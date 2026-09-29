import { Clipboard, showHUD, showToast, Toast } from "@raycast/api";
import { fixGrammar } from "./openai";
import { readSelectedText } from "./selection";
import { loadSettings } from "./settings";

export default async function Command() {
  const settings = await loadSettings();

  if (!settings.openaiApiKey.trim()) {
    await showToast({
      style: Toast.Style.Failure,
      title: "OpenAI API key missing",
      message: "Run Configure and paste your key",
    });
    return;
  }

  let selectedText: string;
  try {
    selectedText = await readSelectedText();
  } catch {
    await showToast({
      style: Toast.Style.Failure,
      title: "No text selected",
      message: "Select some text, then run Fix Spelling and Grammar",
    });
    return;
  }

  if (!selectedText.trim()) {
    await showToast({
      style: Toast.Style.Failure,
      title: "No text selected",
      message: "Select some text, then run Fix Spelling and Grammar",
    });
    return;
  }

  const toast = await showToast({
    style: Toast.Style.Animated,
    title: "Fixing spelling and grammar…",
  });

  try {
    const fixed = await fixGrammar(selectedText, settings.openaiApiKey, settings.model, settings.writingStyle);
    await Clipboard.paste(fixed);
    toast.hide();
    await showHUD("Fixed");
  } catch (error) {
    toast.style = Toast.Style.Failure;
    toast.title = "Fix failed";
    toast.message = error instanceof Error ? error.message : String(error);
  }
}
