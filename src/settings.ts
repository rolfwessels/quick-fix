import { LocalStorage } from "@raycast/api";
import { DEFAULT_WRITING_STYLE, loadWritingStyle, saveWritingStyle } from "./writing-style";

const API_KEY = "openaiApiKey";
const MODEL = "model";

/** Current OpenAI flagship text models (https://platform.openai.com/docs/models). */
export const DEFAULT_MODEL = "gpt-6-luna";

export const MODEL_OPTIONS = [
  { title: "GPT-6 Luna (fast, cheap)", value: "gpt-6-luna" },
  { title: "GPT-6 Sol (balanced)", value: "gpt-6-sol" },
  { title: "GPT-5.6 Terra (balanced, mid-tier)", value: "gpt-5.6-terra" },
] as const;

const KNOWN_MODELS = new Set<string>(MODEL_OPTIONS.map((option) => option.value));

export interface Settings {
  openaiApiKey: string;
  model: string;
  writingStyle: string;
}

export async function loadSettings(): Promise<Settings> {
  const [openaiApiKey, model, writingStyle] = await Promise.all([
    LocalStorage.getItem<string>(API_KEY),
    LocalStorage.getItem<string>(MODEL),
    loadWritingStyle(LocalStorage.getItem),
  ]);

  return {
    openaiApiKey: openaiApiKey ?? "",
    model: resolveModel(model),
    writingStyle,
  };
}

export async function saveSettings(settings: Settings): Promise<void> {
  await Promise.all([
    LocalStorage.setItem(API_KEY, settings.openaiApiKey.trim()),
    LocalStorage.setItem(MODEL, resolveModel(settings.model)),
    saveWritingStyle(LocalStorage.setItem, settings.writingStyle),
  ]);
}

export async function resetWritingStyle(): Promise<string> {
  await saveWritingStyle(LocalStorage.setItem, DEFAULT_WRITING_STYLE);
  return DEFAULT_WRITING_STYLE;
}

function resolveModel(stored: string | undefined): string {
  const value = stored?.trim();
  if (value && KNOWN_MODELS.has(value)) {
    return value;
  }
  return DEFAULT_MODEL;
}
