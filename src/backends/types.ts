export type BackendId = "openai" | "cursor";

export interface ModelOption {
  title: string;
  value: string;
}

export interface FixRequest {
  text: string;
  apiKey: string;
  model: string;
  writingStyle: string;
  /** Optional: backends add laps so slow steps are visible. */
  timer?: import("../timing").Timer;
}

export interface Backend {
  id: BackendId;
  title: string;
  keyLabel: string;
  keyPlaceholder: string;
  privacyNote: string;
  defaultModel: string;
  /** Hard-coded for now. Cursor's list changes often, so this is the seam for a live list later. */
  models: readonly ModelOption[];
  fix(request: FixRequest): Promise<string>;
}
