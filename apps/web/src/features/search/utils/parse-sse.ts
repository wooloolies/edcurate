import type { SearchStageEvent } from "@/features/search/types/search-stream";

const DOUBLE_NEWLINE_RE = /\r?\n\r?\n/;
const NEWLINE_RE = /\r?\n/;

/**
 * Parses a raw SSE buffer string into typed events.
 *
 * SSE spec: events are separated by blank lines (\n\n).
 * Each event may contain one or more field lines, e.g.:
 *   event: stage
 *   data: {...}
 *
 * Returns parsed events and the unconsumed remainder (incomplete event at end).
 */
export function parseSSEBuffer(buffer: string): {
  parsed: SearchStageEvent[];
  remainder: string;
} {
  const parsed: SearchStageEvent[] = [];

  const blocks = buffer.split(DOUBLE_NEWLINE_RE);

  // The last block may be incomplete; keep it as remainder
  const remainder = blocks.pop() ?? "";

  for (const block of blocks) {
    if (!block.trim()) continue;

    let dataLine: string | null = null;

    for (const line of block.split(NEWLINE_RE)) {
      if (line.startsWith("data:")) {
        dataLine = line.slice("data:".length).trimStart();
      }
      // We ignore "event:" field — all events are "stage" type per the contract.
      // We ignore "id:" and "retry:" fields.
    }

    if (dataLine) {
      try {
        const event = JSON.parse(dataLine) as SearchStageEvent;
        parsed.push(event);
      } catch {
        // Skip malformed JSON — stream continues
      }
    }
  }

  return { parsed, remainder };
}
