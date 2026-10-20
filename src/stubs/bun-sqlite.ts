/** Stub so Raycast's bundler can resolve the Bun-only import inside @cursor/sdk/bundled. Never used: we pass a JSONL store. */
export class Database {
  constructor() {
    throw new Error("bun:sqlite is not available in Raycast");
  }
}
