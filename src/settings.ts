import { LocalStorage } from "@raycast/api";
import { BACKENDS, getBackend } from "./backends";
import { BackendId } from "./backends/types";
import { DEFAULT_WRITING_STYLE, loadWritingStyle, saveWritingStyle } from "./writing-style";

const BACKEND = "backend";
// OpenAI keeps its original storage keys, so existing installs need no migration.
const API_KEY_STORAGE: Record<BackendId, string> = { openai: "openaiApiKey", cursor: "cursorApiKey" };
const MODEL_STORAGE: Record<BackendId, string> = { openai: "model", cursor: "cursorModel" };

export interface BackendSettings {
  apiKey: string;
  model: string;
}

export interface Settings {
  backend: BackendId;
  backends: Record<BackendId, BackendSettings>;
  writingStyle: string;
}

export async function loadSettings(): Promise<Settings> {
  const [backend, writingStyle, ...stored] = await Promise.all([
    LocalStorage.getItem<string>(BACKEND),
    loadWritingStyle(LocalStorage.getItem),
    ...BACKENDS.flatMap((b) => [
      LocalStorage.getItem<string>(API_KEY_STORAGE[b.id]),
      LocalStorage.getItem<string>(MODEL_STORAGE[b.id]),
    ]),
  ]);

  const backends = {} as Record<BackendId, BackendSettings>;
  BACKENDS.forEach((b, index) => {
    backends[b.id] = {
      apiKey: stored[index * 2] ?? "",
      model: resolveModel(b.id, stored[index * 2 + 1]),
    };
  });

  return { backend: getBackend(backend).id, backends, writingStyle };
}

export async function saveSettings(settings: Settings): Promise<void> {
  await Promise.all([
    LocalStorage.setItem(BACKEND, settings.backend),
    saveWritingStyle(LocalStorage.setItem, settings.writingStyle),
    ...BACKENDS.flatMap((b) => [
      LocalStorage.setItem(API_KEY_STORAGE[b.id], settings.backends[b.id].apiKey.trim()),
      LocalStorage.setItem(MODEL_STORAGE[b.id], resolveModel(b.id, settings.backends[b.id].model)),
    ]),
  ]);
}

export async function resetWritingStyle(): Promise<string> {
  await saveWritingStyle(LocalStorage.setItem, DEFAULT_WRITING_STYLE);
  return DEFAULT_WRITING_STYLE;
}

function resolveModel(id: BackendId, stored: string | undefined): string {
  const backend = getBackend(id);
  const value = stored?.trim();
  if (value && backend.models.some((model) => model.value === value)) {
    return value;
  }
  return backend.defaultModel;
}
