import { useCallback, useEffect, useRef, useState } from "react";
import type { MediaItem } from "@/types/api";

export type MediaSlotStatus = "idle" | "uploading" | "removing" | "saved" | "error";

type Op = { kind: "upload"; file: File } | { kind: "remove"; id: number };

export function useMediaSlot({
  upload,
  remove,
  initial,
  onConfirmed,
}: {
  upload: (file: File) => Promise<MediaItem>;
  remove: (id: number) => Promise<void>;
  initial: MediaItem | null;
  onConfirmed?: (item: MediaItem | null) => void;
}) {
  const [confirmed, setConfirmedState] = useState<MediaItem | null>(initial);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<MediaSlotStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const confirmedRef = useRef<MediaItem | null>(initial);
  const intentRef = useRef<Op | null>(null);
  const failedRef = useRef<Op | null>(null);
  const runningRef = useRef(false);
  const savedTimer = useRef<number | undefined>(undefined);
  const onConfirmedRef = useRef(onConfirmed);
  onConfirmedRef.current = onConfirmed;

  const applyConfirmed = useCallback((v: MediaItem | null) => {
    confirmedRef.current = v;
    setConfirmedState(v);
    onConfirmedRef.current?.(v);
  }, []);

  const revokePreview = useCallback(() => {
    setPreviewUrl((cur) => {
      if (cur) URL.revokeObjectURL(cur);
      return null;
    });
  }, []);

  const runQueue = useCallback(async () => {
    if (runningRef.current) return;
    runningRef.current = true;
    try {
      while (intentRef.current) {
        const op = intentRef.current;
        setError(null);
        setStatus(op.kind === "upload" ? "uploading" : "removing");
        try {
          if (op.kind === "upload") {
            const item = await upload(op.file);
            if (intentRef.current !== op) continue;
            applyConfirmed(item);
            revokePreview();
            intentRef.current = null;
            failedRef.current = null;
            setStatus("saved");
            if (savedTimer.current) window.clearTimeout(savedTimer.current);
            savedTimer.current = window.setTimeout(() => setStatus("idle"), 1800);
          } else {
            await remove(op.id);
            if (intentRef.current !== op) continue;
            applyConfirmed(null);
            revokePreview();
            intentRef.current = null;
            failedRef.current = null;
            setStatus("saved");
            if (savedTimer.current) window.clearTimeout(savedTimer.current);
            savedTimer.current = window.setTimeout(() => setStatus("idle"), 1800);
          }
        } catch (e: any) {
          if (intentRef.current !== op) continue;
          failedRef.current = op;
          revokePreview();
          intentRef.current = null;
          setStatus("error");
          setError(e?.error || e?.message || "Save failed");
          break;
        }
      }
    } finally {
      runningRef.current = false;
    }
  }, [upload, remove, applyConfirmed, revokePreview]);

  const uploadFile = useCallback((file: File) => {
    revokePreview();
    setPreviewUrl(URL.createObjectURL(file));
    intentRef.current = { kind: "upload", file };
    void runQueue();
  }, [runQueue, revokePreview]);

  const removeItem = useCallback(() => {
    if (!confirmedRef.current) return;
    revokePreview();
    intentRef.current = { kind: "remove", id: confirmedRef.current.id };
    void runQueue();
  }, [runQueue, revokePreview]);

  const retry = useCallback(() => {
    const f = failedRef.current;
    if (!f) return;
    if (f.kind === "upload") {
      revokePreview();
      setPreviewUrl(URL.createObjectURL(f.file));
    }
    intentRef.current = f;
    setStatus("idle");
    setError(null);
    void runQueue();
  }, [runQueue, revokePreview]);

  const resetTo = useCallback((item: MediaItem | null) => {
    revokePreview();
    confirmedRef.current = item;
    setConfirmedState(item);
    intentRef.current = null;
    failedRef.current = null;
    setStatus("idle");
    setError(null);
  }, [revokePreview]);

  useEffect(() => () => {
    if (savedTimer.current) window.clearTimeout(savedTimer.current);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    confirmed,
    displayUrl: previewUrl ?? confirmed?.url ?? null,
    status,
    error,
    saving: status === "uploading" || status === "removing",
    uploadFile,
    removeItem,
    retry,
    resetTo,
    canRetry: failedRef.current !== null,
  };
}
