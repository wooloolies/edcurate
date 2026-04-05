export interface SourceWeights {
  ddgs: number;
  youtube: number;
  openalex: number;
}

const SOURCE_KEYS: (keyof SourceWeights)[] = ["ddgs", "youtube", "openalex"];
const DEFAULT_SOURCE_WEIGHTS: SourceWeights = {
  ddgs: 0.34,
  youtube: 0.33,
  openalex: 0.33,
};

export function coerceSourceWeights(value: unknown): SourceWeights {
  if (!value || typeof value !== "object") {
    return DEFAULT_SOURCE_WEIGHTS;
  }

  const candidate = value as Partial<Record<keyof SourceWeights, unknown>>;
  const weights = SOURCE_KEYS.reduce(
    (acc, key) => {
      const raw = candidate[key];
      acc[key] =
        typeof raw === "number" && Number.isFinite(raw)
          ? Math.min(1, Math.max(0, raw))
          : DEFAULT_SOURCE_WEIGHTS[key];
      return acc;
    },
    { ...DEFAULT_SOURCE_WEIGHTS }
  );

  const total = SOURCE_KEYS.reduce((sum, key) => sum + weights[key], 0);
  if (total <= 0) {
    return DEFAULT_SOURCE_WEIGHTS;
  }

  const normalized = SOURCE_KEYS.reduce(
    (acc, key) => {
      acc[key] = Math.round((weights[key] / total) * 100) / 100;
      return acc;
    },
    { ...DEFAULT_SOURCE_WEIGHTS }
  );

  const normalizedTotal = SOURCE_KEYS.reduce((sum, key) => sum + normalized[key], 0);
  if (normalizedTotal !== 1) {
    normalized.ddgs = Math.round((normalized.ddgs + (1 - normalizedTotal)) * 100) / 100;
  }

  return normalized;
}

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
