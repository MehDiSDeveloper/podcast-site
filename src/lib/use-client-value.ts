"use client";

import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

/**
 * Reads a browser-only value without a hydration mismatch: the server (and the
 * hydration pass) see `serverValue`, then React re-renders with the real one.
 * Replaces the `useEffect(() => setState(...), [])` pattern.
 */
export function useClientValue<T>(getValue: () => T, serverValue: T): T {
  return useSyncExternalStore(noopSubscribe, getValue, () => serverValue);
}
