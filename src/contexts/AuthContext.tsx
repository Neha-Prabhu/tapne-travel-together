import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { apiGet, apiPost, apiPatch } from "@/lib/api";
import type { SessionResponse, SessionUser } from "@/types/api";

export interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  bio: string;
  location: string;
  website: string;
  avatar?: string;
}

function sessionUserToUser(su: SessionUser): User {
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

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => void;
  lastAuthError: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    // Seed from runtime config synchronously to avoid flash
    const cfg = window.TAPNE_RUNTIME_CONFIG;
    if (cfg?.session?.authenticated && cfg.session.user) {
      return sessionUserToUser(cfg.session.user);
    }
    return null;
  });
  const [lastAuthError, setLastAuthError] = useState("");

  // Hydrate session on mount
  useEffect(() => {
    const cfg = window.TAPNE_RUNTIME_CONFIG;
    if (!cfg?.api?.session) return;
    apiGet<SessionResponse>(cfg.api.session)
      .then((data) => {
        if (data.authenticated && data.user) {
          setUser(sessionUserToUser(data.user));
        } else {
          setUser(null);
        }
      })
      .catch(() => {});
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setLastAuthError("");
    try {
      const cfg = window.TAPNE_RUNTIME_CONFIG;
      const data = await apiPost<{ user: SessionUser }>(cfg.api.login, { email, password });
      setUser(sessionUserToUser(data.user));
      return true;
    } catch (err: any) {
      setLastAuthError(err?.error || "Invalid credentials");
      return false;
    }
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string): Promise<boolean> => {
    setLastAuthError("");
    try {
      const cfg = window.TAPNE_RUNTIME_CONFIG;
      const data = await apiPost<{ user: SessionUser }>(cfg.api.signup, { first_name: name, email, password });
      setUser(sessionUserToUser(data.user));
      return true;
    } catch (err: any) {
      setLastAuthError(err?.error || "Something went wrong");
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      const cfg = window.TAPNE_RUNTIME_CONFIG;
      await apiPost(cfg.api.logout, {});
    } catch {}
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (updates: Partial<User>) => {
    try {
      const cfg = window.TAPNE_RUNTIME_CONFIG;
      const payload: Record<string, string> = {};
      if (updates.name !== undefined) payload.display_name = updates.name;
      if (updates.bio !== undefined) payload.bio = updates.bio;
      if (updates.location !== undefined) payload.location = updates.location;
      if (updates.website !== undefined) payload.website = updates.website;
      const data = await apiPatch<{ profile: any }>(cfg.api.profile_me, payload);
      setUser((prev) =>
        prev
          ? {
              ...prev,
              ...updates,
              name: data.profile?.display_name || updates.name || prev.name,
            }
          : null
      );
    } catch {}
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, signup, logout, updateProfile, lastAuthError }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
