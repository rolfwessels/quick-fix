import { appendFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/** Records named laps so we can see where a fix spends its time. Output goes to console (visible in `npm run dev`). */
export interface Timer {
  lap(label: string): void;
  note(label: string, value: string | number | undefined): void;
  summary(): string;
  report(): void;
}

export function createTimer(name: string): Timer {
  const start = Date.now();
  let last = start;
  const laps: { label: string; ms: number }[] = [];
  const notes: string[] = [];

  return {
    lap(label) {
      const now = Date.now();
      laps.push({ label, ms: now - last });
      last = now;
    },
    note(label, value) {
      notes.push(`${label}=${value ?? "n/a"}`);
    },
    summary() {
      const parts = laps.map((l) => `${l.label} ${l.ms}ms`);
      return `${parts.join(" | ")} | total ${Date.now() - start}ms${notes.length ? ` | ${notes.join(" ")}` : ""}`;
    },
    report() {
      const line = `[quick-fix timing] ${new Date().toISOString()} ${name}: ${this.summary()}`;
      console.log(line);
      // Also append to a file, since the console isn't visible outside `npm run dev`.
      try {
        appendFileSync(join(tmpdir(), "quick-fix-timing.log"), `${line}\n`);
      } catch {
        // Measurement must never break a fix.
      }
    },
  };
}

/** Appends one diagnostic line to the same log file the timer uses. Never throws. */
export function logLine(message: string): void {
  const line = `[quick-fix] ${new Date().toISOString()} ${message}`;
  console.log(line);
  try {
    appendFileSync(join(tmpdir(), "quick-fix-timing.log"), `${line}\n`);
  } catch {
    // ignore
  }
}
