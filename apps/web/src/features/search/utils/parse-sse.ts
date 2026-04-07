import type { SearchStageEvent } from "@/features/search/types/search-stream";

// SSE double-newline block separator — handles \r\n\r\n, \n\n, \r\r
const SSE_BLOCK_SEPARATOR = /\r?\n\r?\n/;
// SSE single-line separator
const SSE_LINE_SEPARATOR = /\r?\n/;

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

  // Split on double newline — handles \r\n\r\n, \n\n, \r\r
  const blocks = buffer.split(SSE_BLOCK_SEPARATOR);

  // The last block may be incomplete; keep it as remainder
  const remainder = blocks.pop() ?? "";

  for (const block of blocks) {
    if (!block.trim()) continue;

    let dataLine: string | null = null;

    for (const line of block.split(SSE_LINE_SEPARATOR)) {
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
