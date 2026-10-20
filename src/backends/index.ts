import { cursorBackend } from "./cursor";
import { openaiBackend } from "./openai";
import { Backend, BackendId } from "./types";

export const BACKENDS: readonly Backend[] = [openaiBackend, cursorBackend];
export const DEFAULT_BACKEND_ID: BackendId = "openai";

export function getBackend(id: string | undefined): Backend {
  return BACKENDS.find((backend) => backend.id === id) ?? openaiBackend;
}
