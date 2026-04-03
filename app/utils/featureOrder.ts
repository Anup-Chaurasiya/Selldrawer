export const FEATURE_ORDER_SENTINEL = "__cart-items__";

export const DEFAULT_FEATURE_ORDER = [
  "free-shipping-bar",
  "milestones",
  "free-gifts",
  FEATURE_ORDER_SENTINEL,
  "product-recommendations",
  "savings-display",
  "free-shipping-message",
  "coupon-code",
];

const allowedFeatureIds = new Set(DEFAULT_FEATURE_ORDER);

export function normalizeFeatureOrder(
  order: string[] | null | undefined,
  fallback: string[] = DEFAULT_FEATURE_ORDER
): string[] {
  const raw = Array.isArray(order) ? order : [];
  const sanitized = raw.filter((id) => allowedFeatureIds.has(id));

  const missing = fallback.filter((id) => !sanitized.includes(id));
  const normalized = [...sanitized, ...missing];

  // Ensure sentinel exists exactly once
  const sentinelIndex = normalized.indexOf(FEATURE_ORDER_SENTINEL);
  if (sentinelIndex === -1) {
    const fallbackIndex = fallback.indexOf(FEATURE_ORDER_SENTINEL);
    if (fallbackIndex === -1) {
      normalized.push(FEATURE_ORDER_SENTINEL);
    } else {
      normalized.splice(fallbackIndex, 0, FEATURE_ORDER_SENTINEL);
    }
  } else {
    // Remove any duplicate sentinel entries
    for (let i = normalized.length - 1; i > sentinelIndex; i -= 1) {
      if (normalized[i] === FEATURE_ORDER_SENTINEL) {
        normalized.splice(i, 1);
      }
    }
  }

  return normalized;
}

export function splitFeatureOrder(order: string[]): {
  beforeItems: string[];
  afterItems: string[];
} {
  const normalized = normalizeFeatureOrder(order);
  const sentinelIndex = normalized.indexOf(FEATURE_ORDER_SENTINEL);

  if (sentinelIndex === -1) {
    return { beforeItems: normalized, afterItems: [] };
  }

  return {
    beforeItems: normalized.slice(0, sentinelIndex),
    afterItems: normalized.slice(sentinelIndex + 1),
  };
}

export function reorderFeatureOrder(
  current: string[],
  draggedId: string,
  targetId: string
): string[] {
  if (draggedId === targetId) {
    return current;
  }

  // Find indices in the full array (including sentinel)
  const sourceIndex = current.indexOf(draggedId);
  const destinationIndex = current.indexOf(targetId);

  if (sourceIndex === -1 || destinationIndex === -1) {
    return current;
  }

  // Create a copy and perform the reorder
  const updated = [...current];
  const [removed] = updated.splice(sourceIndex, 1);
  updated.splice(destinationIndex, 0, removed);

  return updated;
}

