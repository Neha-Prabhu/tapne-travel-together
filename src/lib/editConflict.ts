// Helpers for edit-conflict guards used across trip, story, profile and
// settings edits. Every editable resource carries a monotonic revision; the
// client sends `expected_revision` on every update and the server returns 409
// edit_conflict when it doesn't match. Callers use `isEditConflict(err)` to
// detect the case, then preserve unsaved fields, refetch, and open the
// existing conflict dialog before letting the member edit again.

export function isEditConflict(err: unknown): boolean {
  const e = err as any;
  return !!e && e.status === 409 && (e.code === "edit_conflict" || e.reason === "edit_conflict");
}

/** A promise chain factory that serializes async work per-key. Each `run`
 *  call queues after the previous promise on that key so saves never overlap
 *  and later intents always win. */
export function createSerialQueue() {
  const chains = new Map<string, Promise<unknown>>();
  return {
    run<T>(key: string, fn: () => Promise<T>): Promise<T> {
      const prev = chains.get(key) ?? Promise.resolve();
      const next = prev.catch(() => undefined).then(fn);
      chains.set(key, next);
      // Clean up finished chains so the map doesn't grow unbounded.
      next.catch(() => undefined).finally(() => {
        if (chains.get(key) === next) chains.delete(key);
      });
      return next;
    },
  };
}
