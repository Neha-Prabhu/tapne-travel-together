import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { apiGet, apiPost, apiDelete } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { TripData } from "@/types/api";

interface BookmarksContextType {
  ids: Set<number>;
  isBookmarked: (id: number) => boolean;
  add: (id: number) => Promise<void>;
  remove: (id: number) => Promise<void>;
  refresh: () => Promise<void>;
}

const BookmarksContext = createContext<BookmarksContextType | undefined>(undefined);

export const BookmarksProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useAuth();
  const [ids, setIds] = useState<Set<number>>(new Set());

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setIds(new Set());
      return;
    }
    try {
      const cfg = window.TAPNE_RUNTIME_CONFIG;
      const data = await apiGet<{ trips: TripData[] }>(cfg.api.bookmarks);
      setIds(new Set((data.trips || []).map((t) => t.id)));
    } catch {
      // keep current state
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const add = useCallback(async (id: number) => {
    setIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    try {
      const cfg = window.TAPNE_RUNTIME_CONFIG;
      await apiPost(`${cfg.api.bookmarks}${id}/`);
    } catch {
      setIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      throw new Error("failed");
    }
  }, []);

  const remove = useCallback(async (id: number) => {
    setIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    try {
      const cfg = window.TAPNE_RUNTIME_CONFIG;
      await apiDelete(`${cfg.api.bookmarks}${id}/`);
    } catch {
      setIds((prev) => {
        const next = new Set(prev);
        next.add(id);
        return next;
      });
      throw new Error("failed");
    }
  }, []);

  return (
    <BookmarksContext.Provider
      value={{ ids, isBookmarked: (id) => ids.has(id), add, remove, refresh }}
    >
      {children}
    </BookmarksContext.Provider>
  );
};

export function useBookmarks(): BookmarksContextType {
  const ctx = useContext(BookmarksContext);
  if (!ctx) throw new Error("useBookmarks must be used within BookmarksProvider");
  return ctx;
}
