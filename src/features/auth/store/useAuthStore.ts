import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SessionUser } from "@/types/api";

export interface AuthUser {
  id: number;
  username: string;
  name: string;
  email: string;
  bio: string;
  location: string;
  website: string;
  avatar?: string;
}

export function sessionUserToAuthUser(su: SessionUser): AuthUser {
  return {
    id: su.id,
    username: su.username,
    name: su.display_name,
    email: su.email,
    bio: su.bio,
    location: su.location,
    website: su.website,
    avatar: undefined,
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
