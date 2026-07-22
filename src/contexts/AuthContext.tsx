import React, { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from "react";
import { apiGet, apiPost, apiPatch } from "@/lib/api";
import type { SessionResponse, SessionUser } from "@/types/api";
import { useAuthStore, sessionUserToAuthUser, type AuthUser } from "@/features/auth/store/useAuthStore";


export type User = AuthUser;

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  authReady: boolean;
  login: (identifier: string, password: string) => Promise<{ ok: boolean; reason?: "suspended" | "invalid" }>;
  signup: (name: string, email: string, password: string) => Promise<SignupResult>;
  verifySignupCode: (code: string, details?: { name: string; email: string; password: string }) => Promise<{ ok: boolean; reason?: string }>;
  resendSignupCode: (details?: { name?: string; email?: string; password?: string }) => Promise<{ ok: boolean; retry_after?: number; error?: string }>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => Promise<any>;
  setUserMedia: (patch: Partial<Pick<User, "avatar" | "avatar_id" | "cover_photo_url" | "cover_id" | "gallery_media" | "gallery_photos">>) => void;
  lastAuthError: string;
  clearAuthError: () => void;
  /** Open login modal with optional callback after success */
  requireAuth: (onSuccess?: () => void) => void;
  loginModalOpen: boolean;
  setLoginModalOpen: (open: boolean) => void;
  pendingAuthAction: (() => void) | null;
}


export type SignupResult =
  | { status: "verified" }
  | { status: "pending"; email: string }
  | { status: "error"; error: string };

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const store = useAuthStore();
  const [lastAuthError, setLastAuthError] = useState("");
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [pendingAuthAction, setPendingAuthAction] = useState<(() => void) | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const authMutationVersion = useRef(0);

  // Persisted identity is only a hydration hint. Never expose it to protected
  // routes or navigation until the current server session has been checked.
  const user = authReady ? store.user : null;

  useEffect(() => {
    const cfg = window.TAPNE_RUNTIME_CONFIG;
    if (cfg?.session?.authenticated && cfg.session.user && !store.user) {
      store.setAuth(sessionUserToAuthUser(cfg.session.user), cfg.csrf?.token || "session");
    }
  }, []);

  // Handle post-OAuth suspension redirect: providers (e.g. Google) send us
  // back to the originally requested URL with ?auth_error=suspended. We keep
  // the rest of the query intact, surface the same generic suspension notice
  // in the login modal exactly once, and stay signed out so protected content
  // remains locked.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("auth_error") === "suspended") {
      setLastAuthError("__suspended__");
      setLoginModalOpen(true);
      params.delete("auth_error");
      const qs = params.toString();
      const url = window.location.pathname + (qs ? `?${qs}` : "") + window.location.hash;
      window.history.replaceState({}, "", url);
    }
  }, []);


  useEffect(() => {
    const cfg = window.TAPNE_RUNTIME_CONFIG;
    const checkVersion = authMutationVersion.current;

    if (!cfg?.api?.session) {
      if (cfg?.session?.authenticated && cfg.session.user) {
        store.setAuth(sessionUserToAuthUser(cfg.session.user), cfg.csrf?.token || "session");
      } else {
        store.logout();
      }
      setAuthReady(true);
      return;
    }

    apiGet<SessionResponse>(cfg.api.session)
      .then((data) => {
        if (authMutationVersion.current !== checkVersion) return;
        if (data.authenticated && data.user) {
          store.setAuth(sessionUserToAuthUser(data.user), data.csrf_token || "session");
        } else {
          store.logout();
        }
      })
      .catch(() => {
        if (authMutationVersion.current === checkVersion) store.logout();
      })
      .finally(() => setAuthReady(true));
  }, []);


  const login = useCallback(async (identifier: string, password: string): Promise<{ ok: boolean; reason?: "suspended" | "invalid" }> => {
    setLastAuthError("");
    try {
      const cfg = window.TAPNE_RUNTIME_CONFIG;
      const data = await apiPost<{ user: SessionUser; reactivated?: boolean }>(cfg.api.login, { username: identifier, password });
      const authUser = sessionUserToAuthUser(data.user);
      authMutationVersion.current += 1;
      store.setAuth(authUser, "session-token");
      setAuthReady(true);
      if (data.reactivated) {
        // Toast once on reactivation, before navigating to the requested destination.
        const { toast } = await import("sonner");
        toast.success("Welcome back — your account has been reactivated.");
      }
      return { ok: true };
    } catch (err: any) {
      // Suspended accounts surface a distinct sentinel so the login modal
      // renders the required suspension copy with the support email link.
      if (err?.reason === "suspended") {
        setLastAuthError("__suspended__");
        return { ok: false, reason: "suspended" };
      }
      setLastAuthError(err?.error || "Invalid credentials");
      return { ok: false, reason: "invalid" };
    }

  }, []);

  const signup = useCallback(async (name: string, email: string, password: string): Promise<SignupResult> => {
    setLastAuthError("");
    try {
      const cfg = window.TAPNE_RUNTIME_CONFIG;
      const data = await apiPost<{ user?: SessionUser; pending_verification?: boolean; email?: string }>(
        cfg.api.signup, { first_name: name, email, password }
      );
      if (data?.pending_verification) return { status: "pending", email: data.email || email };
      if (data?.user) {
        const authUser = sessionUserToAuthUser(data.user);
        authMutationVersion.current += 1;
        store.setAuth(authUser, "session-token");
        setAuthReady(true);
        return { status: "verified" };
      }
      return { status: "error", error: "Unexpected signup response" };
    } catch (err: any) {
      const msg = err?.error || err?.message || "Something went wrong";
      setLastAuthError(msg);
      return { status: "error", error: msg };
    }
  }, []);

  const verifySignupCode = useCallback(async (code: string, details?: { name: string; email: string; password: string }): Promise<{ ok: boolean; reason?: string }> => {
    setLastAuthError("");
    try {
      const cfg = window.TAPNE_RUNTIME_CONFIG;
      // Always send the currently displayed identity so the account is created
      // from the values the user is looking at, not stale server-side pending data.
      const payload: Record<string, unknown> = { code };
      if (details) {
        payload.first_name = details.name;
        payload.email = details.email;
        payload.password = details.password;
      }
      const data = await apiPost<{ user: SessionUser }>(cfg.api.signup_verify, payload);
      const authUser = sessionUserToAuthUser(data.user);
      authMutationVersion.current += 1;
      store.setAuth(authUser, "session-token");
      setAuthReady(true);
      return { ok: true };
    } catch (err: any) {
      const msg = err?.error || "Invalid code";
      setLastAuthError(msg);
      return { ok: false, reason: err?.reason || "invalid" };
    }
  }, []);

  const resendSignupCode = useCallback(async (details?: { name?: string; email?: string; password?: string }) => {
    try {
      const cfg = window.TAPNE_RUNTIME_CONFIG;
      const payload: Record<string, unknown> = {};
      if (details?.name) payload.first_name = details.name;
      if (details?.email) payload.email = details.email;
      if (details?.password) payload.password = details.password;
      await apiPost(cfg.api.signup_resend, payload);
      return { ok: true };
    } catch (err: any) {
      return { ok: false, retry_after: err?.retry_after, error: err?.error || "Could not resend code" };
    }
  }, []);

  const logout = useCallback(async () => {
    authMutationVersion.current += 1;
    try {
      const cfg = window.TAPNE_RUNTIME_CONFIG;
      await apiPost(cfg.api.logout, {});
    } catch {}
    store.logout();
  }, []);

  const updateProfile = useCallback(async (updates: Partial<User>) => {
    try {
      const cfg = window.TAPNE_RUNTIME_CONFIG;
      // Text-only fields. Profile media (avatar, cover, gallery) is persisted
      // through dedicated multipart endpoints — never sent as part of this
      // JSON PATCH.
      const payload: Record<string, unknown> = {};
      if (updates.name !== undefined) payload.display_name = updates.name;
      if (updates.bio !== undefined) payload.bio = updates.bio;
      if (updates.location !== undefined) payload.location = updates.location;
      if (updates.website !== undefined) payload.website = updates.website;
      if ((updates as any).instagram_url !== undefined) payload.instagram_url = (updates as any).instagram_url;
      if (updates.travel_tags !== undefined) payload.travel_tags = updates.travel_tags;
      const data = await apiPatch<{ profile: any }>(cfg.api.profile_me, payload);
      const p = data.profile || {};
      store.updateUser({
        name: p.display_name ?? updates.name ?? store.user?.name,
        bio: p.bio ?? updates.bio ?? store.user?.bio,
        location: p.location ?? updates.location ?? store.user?.location,
        website: p.website ?? updates.website ?? store.user?.website,
        instagram_url: p.instagram_url ?? (updates as any).instagram_url ?? (store.user as any)?.instagram_url,
        travel_tags: p.travel_tags ?? updates.travel_tags ?? store.user?.travel_tags,
      });
      return data.profile;
    } catch (err) {
      throw err;
    }
  }, []);

  const setUserMedia = useCallback((patch: Partial<Pick<User, "avatar" | "avatar_id" | "cover_photo_url" | "cover_id" | "gallery_media" | "gallery_photos">>) => {
    store.updateUser(patch);
  }, []);



  const requireAuth = useCallback((onSuccess?: () => void) => {
    if (user) {
      onSuccess?.();
      return;
    }
    setPendingAuthAction(() => onSuccess || null);
    setLoginModalOpen(true);
  }, [user]);

  const handleLoginModalChange = useCallback((open: boolean) => {
    setLoginModalOpen(open);
    if (!open) setPendingAuthAction(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      authReady,
      login,
      signup,
      verifySignupCode,
      resendSignupCode,
      logout,
      updateProfile,
      setUserMedia,
      lastAuthError,
      clearAuthError: () => setLastAuthError(""),
      requireAuth,
      loginModalOpen,
      setLoginModalOpen: handleLoginModalChange,
      pendingAuthAction,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}

