import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

export interface TripDraft {
  id: string;
  title: string;
  destination: string;
  category: string;
  summary: string;
  startDate: string;
  endDate: string;
  status: "draft" | "published";
  lastEditedAt: string;
  createdAt: string;
  // All form fields stored as a flat object
  formData: Record<string, any>;
}

interface DraftContextType {
  drafts: TripDraft[];
  createDraft: () => string;
  updateDraft: (id: string, updates: Partial<TripDraft>) => void;
  deleteDraft: (id: string) => void;
  duplicateDraft: (id: string) => string;
  getDraft: (id: string) => TripDraft | undefined;
  publishDraft: (id: string) => void;
}

const DraftContext = createContext<DraftContextType | undefined>(undefined);

const STORAGE_KEY = "tapne_drafts";

const loadDrafts = (): TripDraft[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
};

export const DraftProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [drafts, setDrafts] = useState<TripDraft[]>(loadDrafts);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
  }, [drafts]);

  const createDraft = useCallback((): string => {
    const id = `draft-${Date.now()}`;
    const now = new Date().toISOString();
    const newDraft: TripDraft = {
      id,
      title: "",
      destination: "",
      category: "",
      summary: "",
      startDate: "",
      endDate: "",
      status: "draft",
      lastEditedAt: now,
      createdAt: now,
      formData: {},
    };
    setDrafts(prev => [newDraft, ...prev]);
    return id;
  }, []);

  const updateDraft = useCallback((id: string, updates: Partial<TripDraft>) => {
    setDrafts(prev => prev.map(d =>
      d.id === id ? { ...d, ...updates, lastEditedAt: new Date().toISOString() } : d
    ));
  }, []);

  const deleteDraft = useCallback((id: string) => {
    setDrafts(prev => prev.filter(d => d.id !== id));
  }, []);

  const duplicateDraft = useCallback((id: string): string => {
    const original = drafts.find(d => d.id === id);
    if (!original) return "";
    const newId = `draft-${Date.now()}`;
    const now = new Date().toISOString();
    const copy: TripDraft = {
      ...original,
      id: newId,
      title: original.title ? `Copy of ${original.title}` : "",
      status: "draft",
      lastEditedAt: now,
      createdAt: now,
      formData: { ...original.formData },
    };
    setDrafts(prev => [copy, ...prev]);
    return newId;
  }, [drafts]);

  const getDraft = useCallback((id: string) => drafts.find(d => d.id === id), [drafts]);

  const publishDraft = useCallback((id: string) => {
    setDrafts(prev => prev.map(d =>
      d.id === id ? { ...d, status: "published" as const, lastEditedAt: new Date().toISOString() } : d
    ));
  }, []);

  return (
    <DraftContext.Provider value={{ drafts, createDraft, updateDraft, deleteDraft, duplicateDraft, getDraft, publishDraft }}>
      {children}
    </DraftContext.Provider>
  );
};

export function useDrafts() {
  const ctx = useContext(DraftContext);
  if (!ctx) throw new Error("useDrafts must be used within DraftProvider");
  return ctx;
}
