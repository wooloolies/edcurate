export interface SourceWeights {
  ddgs: number;
  youtube: number;
  openalex: number;
}

const SOURCE_KEYS: (keyof SourceWeights)[] = ["ddgs", "youtube", "openalex"];

/**
 * Normalize source weights when one slider changes.
 * Distributes remaining weight (1 - newValue) proportionally among others.
 */
export function normalizeWeights(
  current: SourceWeights,
  changedKey: keyof SourceWeights,
  newValue: number
): SourceWeights {
  const clamped = Math.min(1, Math.max(0, newValue));
  const remaining = 1 - clamped;
  const otherKeys = SOURCE_KEYS.filter((k) => k !== changedKey);

  const otherTotal = otherKeys.reduce((sum, k) => sum + current[k], 0);

  const result = { ...current, [changedKey]: clamped };

  if (otherTotal === 0) {
    // Distribute equally among others
    for (const k of otherKeys) {
      result[k] = remaining / otherKeys.length;
    }
  } else {
    // Distribute proportionally
    for (const k of otherKeys) {
      result[k] = (current[k] / otherTotal) * remaining;
    }
  }

  // Round to 2 decimals
  for (const k of SOURCE_KEYS) {
    result[k] = Math.round(result[k] * 100) / 100;
  }

  // Fix rounding drift
  const total = SOURCE_KEYS.reduce((sum, k) => sum + result[k], 0);
  if (total !== 1) {
    result[changedKey] += 1 - total;
    result[changedKey] = Math.round(result[changedKey] * 100) / 100;
  }

  return result;
}
