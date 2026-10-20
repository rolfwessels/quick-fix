import { Clipboard, showHUD, showToast, Toast } from "@raycast/api";
import { getBackend } from "./backends";
import { readSelectedText } from "./selection";
import { loadSettings } from "./settings";
import { createTimer } from "./timing";

export default async function Command() {
  const timer = createTimer("fix-grammar");
  const settings = await loadSettings();
  timer.lap("load-settings");
  const backend = getBackend(settings.backend);
  const { apiKey, model } = settings.backends[backend.id];

  if (!apiKey.trim()) {
    await showToast({
      style: Toast.Style.Failure,
      title: `${backend.title} API key missing`,
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

  timer.lap("read-selection");

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
    timer.note("backend", `${backend.id}:${model}`);
    timer.note("chars", selectedText.length);
    const fixed = await backend.fix({ text: selectedText, apiKey, model, writingStyle: settings.writingStyle, timer });
    await Clipboard.paste(fixed);
    timer.lap("paste");
    toast.hide();
    timer.report();
    await showHUD("Fixed");
  } catch (error) {
    timer.lap("failed");
    timer.report();
    toast.style = Toast.Style.Failure;
    toast.title = "Fix failed";
    toast.message = error instanceof Error ? error.message : String(error);
  }
}
