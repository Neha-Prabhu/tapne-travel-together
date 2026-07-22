import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MediaItem } from "@/types/api";
import type { FieldStatus } from "./useSavedField";

export type GalleryPending = {
  tempId: string;
  file: File;
  previewUrl: string;
  status: "uploading" | "error";
  error?: string;
};

export type GalleryRemovalState = { id: number; status: "removing" | "error"; error?: string };

const arraysEqualNum = (a: number[], b: number[]) =>
  a.length === b.length && a.every((v, i) => v === b[i]);

export function useGalleryMedia({
  uploadOne,
  removeOne,
  reorder,
  initial,
  limit,
  onItemsChange,
}: {
  uploadOne: (file: File) => Promise<MediaItem>;
  removeOne: (id: number) => Promise<void>;
  reorder: (ids: number[]) => Promise<void>;
  initial: MediaItem[];
  limit: number;
  onItemsChange?: (items: MediaItem[]) => void;
}) {
  const [items, setItems] = useState<MediaItem[]>(initial);
  const [pending, setPending] = useState<GalleryPending[]>([]);
  const [removals, setRemovals] = useState<Record<number, GalleryRemovalState | undefined>>({});
  const [displayOrder, setDisplayOrder] = useState<number[] | null>(null);
  const [reorderStatus, setReorderStatus] = useState<FieldStatus>("idle");
  const [reorderError, setReorderError] = useState<string | null>(null);

  const itemsRef = useRef<MediaItem[]>(initial);
  const displayOrderRef = useRef<number[] | null>(null);
  const reorderIntentRef = useRef<number[] | null>(null);
  const reorderLastSentRef = useRef<number[] | null>(null);
  const reorderFailedRef = useRef<number[] | null>(null);
  const reorderRunningRef = useRef(false);
  const savedTimer = useRef<number | undefined>(undefined);
  const onItemsRef = useRef(onItemsChange);
  onItemsRef.current = onItemsChange;

  const commitItems = useCallback((next: MediaItem[]) => {
    itemsRef.current = next;
    setItems(next);
    onItemsRef.current?.(next);
  }, []);

  const resetTo = useCallback((next: MediaItem[]) => {
    // Revoke any object URLs left in pending
    setPending((cur) => {
      cur.forEach((p) => URL.revokeObjectURL(p.previewUrl));
      return [];
    });
    itemsRef.current = next;
    setItems(next);
    setRemovals({});
    displayOrderRef.current = null;
    setDisplayOrder(null);
    reorderIntentRef.current = null;
    reorderLastSentRef.current = null;
    reorderFailedRef.current = null;
    setReorderStatus("idle");
    setReorderError(null);
  }, []);

  const runOneUpload = useCallback(async (entry: GalleryPending) => {
    try {
      const item = await uploadOne(entry.file);
      // Success: replace pending tile with confirmed item at end of items.
      setPending((cur) => {
        const found = cur.find((x) => x.tempId === entry.tempId);
        if (found) URL.revokeObjectURL(found.previewUrl);
        return cur.filter((x) => x.tempId !== entry.tempId);
      });
      commitItems([...itemsRef.current, item]);
    } catch (e: any) {
      const msg = e?.error || e?.message || "Upload failed";
      setPending((cur) =>
        cur.map((x) =>
          x.tempId === entry.tempId ? { ...x, status: "error", error: msg } : x,
        ),
      );
    }
  }, [uploadOne, commitItems]);

  const addFiles = useCallback((files: File[]) => {
    const currentSize = itemsRef.current.length + pending.length;
    const capacity = Math.max(0, limit - currentSize);
    const accepted = files.slice(0, capacity);
    const rejected = files.length - accepted.length;
    const newPending: GalleryPending[] = accepted.map((f) => ({
      tempId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      file: f,
      previewUrl: URL.createObjectURL(f),
      status: "uploading",
    }));
    setPending((cur) => [...cur, ...newPending]);
    newPending.forEach((p) => void runOneUpload(p));
    return { accepted: accepted.length, rejected };
  }, [limit, pending.length, runOneUpload]);

  const retryUpload = useCallback((tempId: string) => {
    const entry = pending.find((p) => p.tempId === tempId);
    if (!entry) return;
    setPending((cur) =>
      cur.map((x) => (x.tempId === tempId ? { ...x, status: "uploading", error: undefined } : x)),
    );
    void runOneUpload(entry);
  }, [pending, runOneUpload]);

  const cancelPending = useCallback((tempId: string) => {
    setPending((cur) => {
      const found = cur.find((x) => x.tempId === tempId);
      if (found) URL.revokeObjectURL(found.previewUrl);
      return cur.filter((x) => x.tempId !== tempId);
    });
  }, []);

  const runRemoval = useCallback(async (id: number) => {
    setRemovals((m) => ({ ...m, [id]: { id, status: "removing" } }));
    try {
      await removeOne(id);
      commitItems(itemsRef.current.filter((i) => i.id !== id));
      if (displayOrderRef.current) {
        const next = displayOrderRef.current.filter((x) => x !== id);
        displayOrderRef.current = next;
        setDisplayOrder(next);
      }
      setRemovals((m) => {
        const n = { ...m };
        delete n[id];
        return n;
      });
    } catch (e: any) {
      const msg = e?.error || e?.message || "Remove failed";
      setRemovals((m) => ({ ...m, [id]: { id, status: "error", error: msg } }));
    }
  }, [removeOne, commitItems]);

  const remove = useCallback((id: number) => {
    if (removals[id]?.status === "removing") return;
    void runRemoval(id);
  }, [removals, runRemoval]);

  const retryRemove = useCallback((id: number) => {
    void runRemoval(id);
  }, [runRemoval]);

  const runReorderQueue = useCallback(async () => {
    if (reorderRunningRef.current) return;
    reorderRunningRef.current = true;
    try {
      while (
        reorderIntentRef.current &&
        (!reorderLastSentRef.current ||
          !arraysEqualNum(reorderIntentRef.current, reorderLastSentRef.current))
      ) {
        const attempt = reorderIntentRef.current;
        reorderLastSentRef.current = attempt;
        setReorderStatus("saving");
        setReorderError(null);
        try {
          await reorder(attempt);
          if (reorderIntentRef.current !== attempt) continue;
          const byId = new Map(itemsRef.current.map((i) => [i.id, i]));
          const reordered = attempt.map((id) => byId.get(id)).filter(Boolean) as MediaItem[];
          commitItems(reordered);
          displayOrderRef.current = null;
          setDisplayOrder(null);
          reorderFailedRef.current = null;
          setReorderStatus("saved");
          if (savedTimer.current) window.clearTimeout(savedTimer.current);
          savedTimer.current = window.setTimeout(() => setReorderStatus("idle"), 1800);
        } catch (e: any) {
          if (reorderIntentRef.current !== attempt) continue;
          reorderFailedRef.current = attempt;
          displayOrderRef.current = null;
          setDisplayOrder(null);
          reorderIntentRef.current = null;
          setReorderStatus("error");
          setReorderError(e?.error || e?.message || "Reorder failed");
          break;
        }
      }
    } finally {
      reorderRunningRef.current = false;
    }
  }, [reorder, commitItems]);

  const setOrder = useCallback((ids: number[]) => {
    displayOrderRef.current = ids;
    setDisplayOrder(ids);
    reorderIntentRef.current = ids;
    void runReorderQueue();
  }, [runReorderQueue]);

  const move = useCallback((id: number, dir: -1 | 1) => {
    const currentOrder =
      displayOrderRef.current ?? itemsRef.current.map((i) => i.id);
    const idx = currentOrder.indexOf(id);
    const j = idx + dir;
    if (idx < 0 || j < 0 || j >= currentOrder.length) return;
    const next = [...currentOrder];
    [next[idx], next[j]] = [next[j], next[idx]];
    setOrder(next);
  }, [setOrder]);

  const retryReorder = useCallback(() => {
    const failed = reorderFailedRef.current;
    if (!failed) return;
    displayOrderRef.current = failed;
    setDisplayOrder(failed);
    reorderIntentRef.current = failed;
    reorderLastSentRef.current = null;
    setReorderStatus("idle");
    setReorderError(null);
    void runReorderQueue();
  }, [runReorderQueue]);

  const orderedItems = useMemo(() => {
    if (!displayOrder) return items;
    const byId = new Map(items.map((i) => [i.id, i]));
    return displayOrder.map((id) => byId.get(id)).filter(Boolean) as MediaItem[];
  }, [items, displayOrder]);

  useEffect(() => () => {
    if (savedTimer.current) window.clearTimeout(savedTimer.current);
    pending.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    items: orderedItems,
    pending,
    removals,
    reorderStatus,
    reorderError,
    canAddMore: orderedItems.length + pending.length < limit,
    totalCount: orderedItems.length + pending.length,
    addFiles,
    retryUpload,
    cancelPending,
    remove,
    retryRemove,
    move,
    retryReorder,
    resetTo,
  };
}
