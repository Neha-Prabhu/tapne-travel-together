import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { TripData, MyTripsResponse } from "@/types/api";
import { createSerialQueue } from "@/lib/editConflict";

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
  /** Server revision — used as `expected_revision` on the next update. */
  revision: number;
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
    revision: t.revision ?? 1,
    formData: {
      description: t.description || "",
      originCity: t.origin_city || "",
      heroImage: t.banner_image_url || null,
      galleryImages: t.gallery_image_urls || [],
      currency: t.currency || "INR",
      totalPrice: t.price_per_person?.toString() || "",
      earlyBirdPrice: t.early_bird_price?.toString() || "",
      earlyBirdSeats: t.early_bird_seats?.toString() || "",
      advanceAmount: t.advance_amount?.toString() || "",
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
      experienceLevel: t.experience_level || t.difficulty_level || "",
      fitnessLevel: t.fitness_level || t.pace_level || "",
      stays: (t.stays || []).map((s, i) => ({
        id: s.id || `s${i + 1}`,
        accommodationType: s.accommodation_type || "",
        roomSharing: s.room_sharing || "",
        stayName: s.name || "",
        stayDescription: s.description || "",
        amenities: s.amenities || [],
        amenityInput: "",
      })),
      ageRange: t.age_range || [18, 60],
      enforceAge: t.enforce_age || false,
      codeOfConduct: t.code_of_conduct || "",
      generalPolicy: t.general_policy || "",
      cancellationPolicy: t.cancellation_policy || "",
      medicalDeclaration: t.medical_declaration || false,
      emergencyContact: t.emergency_contact || false,
      medicalDetails: t.medical_details || "",
      emergencyDetails: t.emergency_details || "",
      faqs: (t.faqs || []).map((f, i) => ({ id: `f${i}`, question: f.question, answer: f.answer })),
      accessType: t.access_type || "open",
      customQuestions: t.application_questions || [],
      autoApprove: t.auto_approve || false,
      paymentMethod: t.payment_method || "direct_contact",
      paymentDetails: t.payment_details || "",
      contactPreferences: t.contact_preferences || ["In-app chat"],
      hosts: t.co_hosts || "",
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
    if (fd.description !== undefined) p.description = fd.description;
    if (fd.originCity !== undefined) p.origin_city = fd.originCity;
    if (fd.heroImage !== undefined) p.banner_image_url = fd.heroImage;
    if (fd.galleryImages !== undefined) p.gallery_image_urls = fd.galleryImages;
    if (fd.currency !== undefined) p.currency = fd.currency;
    if (fd.totalPrice !== undefined) p.price_per_person = fd.totalPrice ? Number(fd.totalPrice) : null;
    if (fd.earlyBirdPrice !== undefined) p.early_bird_price = fd.earlyBirdPrice ? Number(fd.earlyBirdPrice) : null;
    if (fd.earlyBirdSeats !== undefined) p.early_bird_seats = fd.earlyBirdSeats ? Number(fd.earlyBirdSeats) : null;
    if (fd.advanceAmount !== undefined) p.advance_amount = fd.advanceAmount ? Number(fd.advanceAmount) : null;
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
    if (fd.experienceLevel !== undefined) p.experience_level = fd.experienceLevel;
    if (fd.fitnessLevel !== undefined) p.fitness_level = fd.fitnessLevel;
    if (fd.stays !== undefined) p.stays = fd.stays.map((s: any) => ({
      id: s.id,
      accommodation_type: s.accommodationType,
      room_sharing: s.roomSharing,
      name: s.stayName,
      description: s.stayDescription,
      amenities: s.amenities,
    }));
    if (fd.ageRange !== undefined) p.age_range = fd.ageRange;
    if (fd.enforceAge !== undefined) p.enforce_age = fd.enforceAge;
    if (fd.codeOfConduct !== undefined) p.code_of_conduct = fd.codeOfConduct;
    if (fd.generalPolicy !== undefined) p.general_policy = fd.generalPolicy;
    if (fd.cancellationPolicy !== undefined) p.cancellation_policy = fd.cancellationPolicy;
    if (fd.medicalDeclaration !== undefined) p.medical_declaration = fd.medicalDeclaration;
    if (fd.emergencyContact !== undefined) p.emergency_contact = fd.emergencyContact;
    if (fd.medicalDetails !== undefined) p.medical_details = fd.medicalDetails;
    if (fd.emergencyDetails !== undefined) p.emergency_details = fd.emergencyDetails;
    if (fd.faqs !== undefined) p.faqs = fd.faqs.map((f: any) => ({ question: f.question, answer: f.answer }));
    if (fd.accessType !== undefined) p.access_type = fd.accessType;
    if (fd.customQuestions !== undefined) p.application_questions = fd.customQuestions;
    if (fd.autoApprove !== undefined) p.auto_approve = fd.autoApprove;
    if (fd.paymentMethod !== undefined) p.payment_method = fd.paymentMethod;
    if (fd.paymentDetails !== undefined) p.payment_details = fd.paymentDetails;
    if (fd.contactPreferences !== undefined) p.contact_preferences = fd.contactPreferences;
    if (fd.hosts !== undefined) p.co_hosts = fd.hosts;
  }
  return p;
}

interface DraftContextType {
  drafts: TripDraft[];
  createDraft: () => Promise<number>;
  /** Serialized, revision-guarded update. Resolves after the write lands; on
   *  409 edit_conflict throws the raw API error so callers can open the
   *  conflict dialog. Later `updateDraft` calls always send the latest values
   *  with the newly-returned revision. */
  updateDraft: (id: number, updates: Partial<TripDraft>) => Promise<void>;
  deleteDraft: (id: number) => void;
  duplicateDraft: (id: number) => Promise<number>;
  getDraft: (id: number) => TripDraft | undefined;
  /** Waits for any in-flight save on this draft, then publishes with the
   *  latest known revision. */
  publishDraft: (id: number, currentFormData?: Record<string, any>) => Promise<number | null>;
  /** Refetches the latest server copy after a conflict so the form can be
   *  re-populated before the member edits again. */
  reloadDraft: (id: number) => Promise<TripDraft | null>;
  loading: boolean;
}

const DraftContext = createContext<DraftContextType | undefined>(undefined);

export const DraftProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [drafts, setDrafts] = useState<TripDraft[]>([]);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  const isAuthenticatedRef = useRef(isAuthenticated);
  isAuthenticatedRef.current = isAuthenticated;

  useEffect(() => { isAuthenticatedRef.current = isAuthenticated; }, [isAuthenticated]);

  // Per-draft serial save queue.
  const queueRef = useRef(createSerialQueue());
  // Authoritative revision map, keyed by draft id. Kept in a ref so serial
  // saves see the newest value even when triggered before React re-renders.
  const revisionsRef = useRef<Map<number, number>>(new Map());
  const setRevision = (id: number, rev: number) => {
    revisionsRef.current.set(id, rev);
    setDrafts((prev) => prev.map((d) => (d.id === id ? { ...d, revision: rev } : d)));
  };

  useEffect(() => {
    if (!isAuthenticated) {
      setDrafts([]);
      revisionsRef.current.clear();
      return;
    }
    const cfg = window.TAPNE_RUNTIME_CONFIG;
    setLoading(true);
    apiGet<MyTripsResponse>(cfg.api.my_trips)
      .then((data) => {
        const allDrafts = data.trips.map(tripDataToDraft);
        setDrafts(allDrafts);
        revisionsRef.current = new Map(allDrafts.map((d) => [d.id, d.revision]));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  const createDraft = useCallback(async (): Promise<number> => {
    if (!isAuthenticatedRef.current) return 0;
    const cfg = window.TAPNE_RUNTIME_CONFIG;
    const data = await apiPost<{ draft: TripData }>(cfg.api.trip_drafts, { title: "", destination: "" });
    const newDraft = tripDataToDraft(data.draft);
    revisionsRef.current.set(newDraft.id, newDraft.revision);
    setDrafts((prev) => [newDraft, ...prev]);
    return newDraft.id;
  }, []);

  const updateDraft = useCallback((id: number, updates: Partial<TripDraft>): Promise<void> => {
    setDrafts((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...updates, lastEditedAt: new Date().toISOString() } : d))
    );
    const cfg = window.TAPNE_RUNTIME_CONFIG;
    const payload = draftToServerPayload(updates);
    if (Object.keys(payload).length === 0) return Promise.resolve();
    return queueRef.current.run(`draft:${id}`, async () => {
      const expected = revisionsRef.current.get(id);
      const data = await apiPatch<{ draft: TripData }>(
        `${cfg.api.trip_drafts}${id}/`,
        { ...payload, expected_revision: expected },
      );
      const nextRev = data?.draft?.revision;
      if (typeof nextRev === "number") setRevision(id, nextRev);
    });
  }, []);

  const deleteDraft = useCallback(async (id: number) => {
    const cfg = window.TAPNE_RUNTIME_CONFIG;
    try {
      await apiDelete(`${cfg.api.trip_drafts}${id}/`);
      revisionsRef.current.delete(id);
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
    revisionsRef.current.set(newDraft.id, newDraft.revision);
    setDrafts((prev) => [newDraft, ...prev]);
    return newDraft.id;
  }, [drafts]);

  const getDraft = useCallback((id: number) => drafts.find((d) => d.id === id), [drafts]);

  const reloadDraft = useCallback(async (id: number): Promise<TripDraft | null> => {
    const cfg = window.TAPNE_RUNTIME_CONFIG;
    try {
      const data = await apiGet<MyTripsResponse>(cfg.api.my_trips);
      const t = data.trips.find((x) => x.id === id);
      if (!t) return null;
      const d = tripDataToDraft(t);
      revisionsRef.current.set(id, d.revision);
      setDrafts((prev) => prev.map((x) => (x.id === id ? d : x)));
      return d;
    } catch {
      return null;
    }
  }, []);

  const publishDraft = useCallback(async (id: number, currentFormData?: Record<string, any>) => {
    const cfg = window.TAPNE_RUNTIME_CONFIG;

    if (currentFormData && Object.keys(currentFormData).length > 0) {
      // Queue a final save with the latest values before publishing.
      await updateDraft(id, { formData: currentFormData } as Partial<TripDraft>);
    } else {
      // Drain any pending save.
      await queueRef.current.run(`draft:${id}`, async () => {});
    }

    let publishedId: number | null = null;
    const res = await queueRef.current.run(`draft:${id}`, async () => {
      const expected = revisionsRef.current.get(id);
      return apiPost<{ trip_id?: number; id?: number }>(
        `${cfg.api.trip_drafts}${id}/publish/`,
        { expected_revision: expected },
      );
    });
    publishedId = res?.trip_id ?? res?.id ?? id;
    revisionsRef.current.delete(id);
    setDrafts((prev) => prev.filter((d) => d.id !== id));
    return publishedId;
  }, [updateDraft]);

  return (
    <DraftContext.Provider value={{ drafts, createDraft, updateDraft, deleteDraft, duplicateDraft, getDraft, publishDraft, reloadDraft, loading }}>
      {children}
    </DraftContext.Provider>
  );
};

export function useDrafts() {
  const ctx = useContext(DraftContext);
  if (!ctx) throw new Error("useDrafts must be used within DraftProvider");
  return ctx;
}
