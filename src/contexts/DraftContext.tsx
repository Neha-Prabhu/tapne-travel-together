import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { TripData, MyTripsResponse } from "@/types/api";

export interface TripDraft {
  id: number;
  title: string;
  destination: string;
  category: string;
  summary: string;
  startDate: string;
  endDate: string;
  status: "draft" | "published";
  lastEditedAt: string;
  createdAt: string;
  formData: Record<string, any>;
}

function tripDataToDraft(t: TripData): TripDraft {
  return {
    id: t.id,
    title: t.title || "",
    destination: t.destination || "",
    category: t.trip_type || "",
    summary: t.summary || "",
    startDate: t.starts_at || "",
    endDate: t.ends_at || "",
    status: t.is_draft ? "draft" : "published",
    lastEditedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    formData: {
      totalPrice: t.price_per_person?.toString() || "",
      earlyBirdPrice: t.early_bird_price?.toString() || "",
      paymentTerms: t.payment_terms || "full",
      totalSeats: t.total_seats?.toString() || "",
      minSeats: t.minimum_seats?.toString() || "",
      bookingCloseDate: t.booking_closes_at || "",
      highlights: t.highlights || [],
      itinerary: (t.itinerary_days || []).map((d) => ({
        id: `d${d.day_number}`,
        title: d.title,
        description: d.description,
        isFlexible: d.is_flexible || false,
      })),
      includedItems: t.included_items || [],
      notIncludedItems: t.not_included_items || [],
      thingsToCarry: t.things_to_carry || [],
      suitableFor: t.suitable_for || [],
      tripVibes: t.trip_vibe || [],
      difficultyLevel: t.difficulty_level || "",
      paceLevel: t.pace_level || "",
      cancellationPolicy: t.cancellation_policy || "",
      faqs: (t.faqs || []).map((f, i) => ({ id: `f${i}`, question: f.question, answer: f.answer })),
    },
  };
}

// Map frontend draft fields to snake_case server fields
function draftToServerPayload(updates: Partial<TripDraft>): Record<string, any> {
  const p: Record<string, any> = {};
  if (updates.title !== undefined) p.title = updates.title;
  if (updates.destination !== undefined) p.destination = updates.destination;
  if (updates.category !== undefined) p.trip_type = updates.category;
  if (updates.summary !== undefined) p.summary = updates.summary;
  if (updates.startDate !== undefined) p.starts_at = updates.startDate;
  if (updates.endDate !== undefined) p.ends_at = updates.endDate;

  if (updates.formData) {
    const fd = updates.formData;
    if (fd.totalPrice !== undefined) p.price_per_person = fd.totalPrice ? Number(fd.totalPrice) : null;
    if (fd.earlyBirdPrice !== undefined) p.early_bird_price = fd.earlyBirdPrice ? Number(fd.earlyBirdPrice) : null;
    if (fd.paymentTerms !== undefined) p.payment_terms = fd.paymentTerms;
    if (fd.totalSeats !== undefined) p.total_seats = fd.totalSeats ? Number(fd.totalSeats) : null;
    if (fd.minSeats !== undefined) p.minimum_seats = fd.minSeats ? Number(fd.minSeats) : null;
    if (fd.bookingCloseDate !== undefined) p.booking_closes_at = fd.bookingCloseDate;
    if (fd.highlights !== undefined) p.highlights = fd.highlights;
    if (fd.itinerary !== undefined) {
      p.itinerary_days = fd.itinerary.map((d: any, i: number) => ({
        day_number: i + 1,
        title: d.title,
        description: d.description,
        is_flexible: d.isFlexible || false,
      }));
    }
    if (fd.includedItems !== undefined) p.included_items = fd.includedItems;
    if (fd.notIncludedItems !== undefined) p.not_included_items = fd.notIncludedItems;
    if (fd.thingsToCarry !== undefined) p.things_to_carry = fd.thingsToCarry;
    if (fd.suitableFor !== undefined) p.suitable_for = fd.suitableFor;
    if (fd.tripVibes !== undefined) p.trip_vibe = fd.tripVibes;
    if (fd.difficultyLevel !== undefined) p.difficulty_level = fd.difficultyLevel;
    if (fd.paceLevel !== undefined) p.pace_level = fd.paceLevel;
    if (fd.cancellationPolicy !== undefined) p.cancellation_policy = fd.cancellationPolicy;
    if (fd.faqs !== undefined) p.faqs = fd.faqs.map((f: any) => ({ question: f.question, answer: f.answer }));
  }
  return p;
}

interface DraftContextType {
  drafts: TripDraft[];
  createDraft: () => Promise<number>;
  updateDraft: (id: number, updates: Partial<TripDraft>) => void;
  deleteDraft: (id: number) => void;
  duplicateDraft: (id: number) => Promise<number>;
  getDraft: (id: number) => TripDraft | undefined;
  publishDraft: (id: number, currentFormData?: Record<string, any>) => Promise<void>;
  loading: boolean;
}

const DraftContext = createContext<DraftContextType | undefined>(undefined);

export const DraftProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [drafts, setDrafts] = useState<TripDraft[]>([]);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const isAuthenticatedRef = useRef(isAuthenticated);

  useEffect(() => {
    isAuthenticatedRef.current = isAuthenticated;
  }, [isAuthenticated]);

  // Load drafts from API — re-runs when isAuthenticated changes
  useEffect(() => {
    if (!isAuthenticated) {
      setDrafts([]);
      return;
    }
    const cfg = window.TAPNE_RUNTIME_CONFIG;
    setLoading(true);
    apiGet<MyTripsResponse>(cfg.api.my_trips)
      .then((data) => {
        const allDrafts = data.trips.map(tripDataToDraft);
        setDrafts(allDrafts);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  const createDraft = useCallback(async (): Promise<number> => {
    if (!isAuthenticatedRef.current) return 0;
    const cfg = window.TAPNE_RUNTIME_CONFIG;
    const data = await apiPost<{ draft: TripData }>(cfg.api.trip_drafts, { title: "", destination: "" });
    const newDraft = tripDataToDraft(data.draft);
    setDrafts((prev) => [newDraft, ...prev]);
    return newDraft.id;
  }, []);

  const updateDraft = useCallback((id: number, updates: Partial<TripDraft>) => {
    setDrafts((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...updates, lastEditedAt: new Date().toISOString() } : d))
    );
    const cfg = window.TAPNE_RUNTIME_CONFIG;
    const payload = draftToServerPayload(updates);
    if (Object.keys(payload).length > 0) {
      apiPatch(`${cfg.api.trip_drafts}${id}/`, payload).catch(() => {});
    }
  }, []);

  const deleteDraft = useCallback(async (id: number) => {
    const cfg = window.TAPNE_RUNTIME_CONFIG;
    try {
      await apiDelete(`${cfg.api.trip_drafts}${id}/`);
      setDrafts((prev) => prev.filter((d) => d.id !== id));
    } catch {}
  }, []);

  const duplicateDraft = useCallback(async (id: number): Promise<number> => {
    const original = drafts.find((d) => d.id === id);
    if (!original) return 0;
    const cfg = window.TAPNE_RUNTIME_CONFIG;
    const payload = draftToServerPayload(original);
    payload.title = original.title ? `Copy of ${original.title}` : "";
    const data = await apiPost<{ draft: TripData }>(cfg.api.trip_drafts, payload);
    const newDraft = tripDataToDraft(data.draft);
    setDrafts((prev) => [newDraft, ...prev]);
    return newDraft.id;
  }, [drafts]);

  const getDraft = useCallback((id: number) => drafts.find((d) => d.id === id), [drafts]);

  const publishDraft = useCallback(async (id: number, currentFormData?: Record<string, any>) => {
    const cfg = window.TAPNE_RUNTIME_CONFIG;

    // If caller passes unsaved form data, PATCH it first to avoid race condition
    if (currentFormData && Object.keys(currentFormData).length > 0) {
      const payload = draftToServerPayload({ formData: currentFormData } as Partial<TripDraft>);
      if (Object.keys(payload).length > 0) {
        await apiPatch(`${cfg.api.trip_drafts}${id}/`, payload);
      }
    }

    try {
      await apiPost(`${cfg.api.trip_drafts}${id}/publish/`, {});
    } catch (err: any) {
      throw new Error(err?.message || err?.error || "Could not publish trip");
    }

    setDrafts((prev) => prev.filter((d) => d.id !== id));
    navigate("/my-trips");
  }, [navigate]);

  return (
    <DraftContext.Provider value={{ drafts, createDraft, updateDraft, deleteDraft, duplicateDraft, getDraft, publishDraft, loading }}>
      {children}
    </DraftContext.Provider>
  );
};

export function useDrafts() {
  const ctx = useContext(DraftContext);
  if (!ctx) throw new Error("useDrafts must be used within DraftProvider");
  return ctx;
}
