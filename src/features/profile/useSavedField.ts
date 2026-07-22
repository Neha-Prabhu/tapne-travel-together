import { useCallback, useEffect, useRef, useState } from "react";

export type FieldStatus = "idle" | "saving" | "saved" | "error";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 2 * 1024 * 1024;

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return `${file.name}: only JPEG, PNG, or WebP images are allowed.`;
  }
  if (file.size > MAX_BYTES) {
    return `${file.name}: image is larger than 2 MB.`;
  }
  return null;
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(new Error("Could not read file"));
    r.readAsDataURL(file);
  });
}

interface SavedFieldOptions<T> {
  save: (value: T) => Promise<void>;
  isEqual?: (a: T, b: T) => boolean;
}

/**
 * Field state with an optimistic value, a last-confirmed value, and a serial
 * save queue that guarantees the latest intent wins. Failures roll back the
 * visible value to the last confirmed one and expose retry() which reapplies
 * the failed intent.
 */
export function useSavedField<T>(initial: T, { save, isEqual }: SavedFieldOptions<T>) {
  const eq = isEqual || ((a: T, b: T) => a === b);
  const [value, setLocalValue] = useState<T>(initial);
  const [confirmed, setConfirmedState] = useState<T>(initial);
  const [status, setStatus] = useState<FieldStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const intentRef = useRef<T>(initial);
  const lastSentRef = useRef<T>(initial);
  const confirmedRef = useRef<T>(initial);
  const failedIntentRef = useRef<T | null>(null);
  const runningRef = useRef(false);
  const savedTimer = useRef<number | undefined>(undefined);

  const setConfirmed = useCallback((v: T) => {
    confirmedRef.current = v;
    setConfirmedState(v);
  }, []);

  const runQueue = useCallback(async () => {
    if (runningRef.current) return;
    runningRef.current = true;
    try {
      while (!eq(intentRef.current, lastSentRef.current)) {
        const attempt = intentRef.current;
        lastSentRef.current = attempt;
        setStatus("saving");
        setError(null);
        try {
          await save(attempt);
          if (eq(intentRef.current, attempt)) {
            setConfirmed(attempt);
            failedIntentRef.current = null;
            setStatus("saved");
            if (savedTimer.current) window.clearTimeout(savedTimer.current);
            savedTimer.current = window.setTimeout(() => setStatus("idle"), 1800);
          }
          // if intent has moved on, loop continues with the newer intent
        } catch (err: any) {
          if (!eq(intentRef.current, attempt)) {
            // A newer intent arrived while this one was in flight; try that one instead.
            continue;
          }
          failedIntentRef.current = attempt;
          // Visibly roll back to the last confirmed value.
          setLocalValue(confirmedRef.current);
          intentRef.current = confirmedRef.current;
          lastSentRef.current = confirmedRef.current;
          setStatus("error");
          setError(err?.error || err?.message || "Save failed");
          break;
        }
      }
    } finally {
      runningRef.current = false;
    }
  }, [save, eq, setConfirmed]);

  const setValue = useCallback((next: T) => {
    setLocalValue(next);
    intentRef.current = next;
    void runQueue();
  }, [runQueue]);

  const retry = useCallback(() => {
    const failed = failedIntentRef.current;
    if (failed === null) return;
    setLocalValue(failed);
    intentRef.current = failed;
    lastSentRef.current = confirmedRef.current;
    setStatus("idle");
    setError(null);
    void runQueue();
  }, [runQueue]);

  const resetTo = useCallback((v: T) => {
    setLocalValue(v);
    setConfirmed(v);
    intentRef.current = v;
    lastSentRef.current = v;
    failedIntentRef.current = null;
    setStatus("idle");
    setError(null);
  }, [setConfirmed]);

  useEffect(() => () => {
    if (savedTimer.current) window.clearTimeout(savedTimer.current);
  }, []);

  return {
    value,
    confirmed,
    status,
    error,
    setValue,
    retry,
    resetTo,
    saving: status === "saving",
  };
}
