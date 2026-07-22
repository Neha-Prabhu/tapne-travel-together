import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { MediaItem, SessionUser } from "@/types/api";

export interface AuthUser {
  id: number;
  username: string;
  name: string;
  email: string;
  bio: string;
  location: string;
  website: string;
  instagram_url?: string;
  avatar?: string;
  avatar_id?: number;
  travel_tags?: string[];
  cover_photo_url?: string;
  cover_id?: number;
  gallery_photos?: string[];
  gallery_media?: MediaItem[];
}

export function sessionUserToAuthUser(
  su: SessionUser & {
    avatar_url?: string;
    avatar_id?: number;
    travel_tags?: string[];
    cover_photo_url?: string;
    cover_id?: number;
    gallery_photos?: string[];
    gallery_media?: MediaItem[];
  },
): AuthUser {
  return {
    id: su.id,
    username: su.username,
    name: su.display_name,
    email: su.email,
    bio: su.bio,
    location: su.location,
    website: su.website,
    avatar: su.avatar_url,
    avatar_id: su.avatar_id,
    travel_tags: su.travel_tags,
    cover_photo_url: su.cover_photo_url,
    cover_id: su.cover_id,
    gallery_photos: su.gallery_photos,
    gallery_media: su.gallery_media,
  };
}


interface AuthState {
  user: AuthUser | null;
  token: string | null;
  setAuth: (user: AuthUser, token: string) => void;
  setUser: (user: AuthUser | null) => void;
  updateUser: (updates: Partial<AuthUser>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: (user, token) => set({ user, token }),
      setUser: (user) => set({ user }),
      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
      logout: () => set({ user: null, token: null }),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);
