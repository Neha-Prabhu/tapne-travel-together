import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";

import { useAuth } from "@/contexts/AuthContext";
import { apiGet, apiPatch, apiPost, apiDelete } from "@/lib/api";
import { toast } from "sonner";

import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, AlertTriangle, PauseCircle, SettingsIcon, ShieldOff, ExternalLink, Check, Lock } from "lucide-react";

interface BlockedUser {
  username: string;
  display_name: string;
  avatar_url?: string | null;
}

interface DeactivationBlocker {
  trip_id: number;
  title: string;
  role: "host" | "traveler";
  status?: string;
  pending_count?: number;
  approved_count?: number;
}

type EmailUpdates = "all" | "important" | "none";
type ProfileVisibility = "public" | "members_only";
type DmPrivacy = "everyone" | "followers" | "no_one";
type Theme = "system" | "light" | "dark";

interface SettingsPayload {
  email_updates: EmailUpdates;
  profile_visibility: ProfileVisibility;
  dm_privacy: DmPrivacy;
  theme: Theme;
  digest_emails: boolean;
}

const DEFAULTS: SettingsPayload = {
  email_updates: "all",
  profile_visibility: "public",
  dm_privacy: "followers",
  theme: "system",
  digest_emails: true,
};

// Migrate any legacy stored values into the current schema so a member who
// previously saved `email_updates: true` still gets a valid radio selection.
function normalize(raw: Partial<Record<keyof SettingsPayload, unknown>>): SettingsPayload {
  const out: SettingsPayload = { ...DEFAULTS };

  const eu = raw.email_updates;
  if (eu === "all" || eu === "important" || eu === "none") out.email_updates = eu;
  else if (eu === true) out.email_updates = "all";
  else if (eu === false) out.email_updates = "none";

  const pv = raw.profile_visibility;
  if (pv === "public" || pv === "members_only") out.profile_visibility = pv;

  const dm = raw.dm_privacy;
  if (dm === "everyone" || dm === "followers" || dm === "no_one") out.dm_privacy = dm;
  else if (dm === "anyone") out.dm_privacy = "everyone";
  else if (dm === "members_only") out.dm_privacy = "followers";

  const th = raw.theme;
  if (th === "system" || th === "light" || th === "dark") out.theme = th;

  if (typeof raw.digest_emails === "boolean") out.digest_emails = raw.digest_emails;

  return out;
}

const Settings = () => {
  const { isAuthenticated, requireAuth, logout } = useAuth();
  const navigate = useNavigate();

  const [values, setValues] = useState<SettingsPayload>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const lastSavedRef = useRef<SettingsPayload>(DEFAULTS);
  // The member's most recent desired settings — always the latest intent,
  // even when the last save failed. Retry and follow-up saves use this.
  const pendingIntentRef = useRef<SettingsPayload>(DEFAULTS);
  // Whether the last save attempt failed and pendingIntent still needs to land.
  const dirtyRef = useRef(false);
  const savingRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [blockers, setBlockers] = useState<DeactivationBlocker[] | null>(null);

  const [blocked, setBlocked] = useState<BlockedUser[]>([]);
  const [blockedLoading, setBlockedLoading] = useState(true);
  const [blockedError, setBlockedError] = useState(false);
  const [unblockTarget, setUnblockTarget] = useState<BlockedUser | null>(null);
  const [unblocking, setUnblocking] = useState(false);
  const [unblockError, setUnblockError] = useState<string | null>(null);

  useEffect(() => { if (!isAuthenticated) requireAuth(() => {}); }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const cfg = window.TAPNE_RUNTIME_CONFIG;
        const data = await apiGet<Partial<Record<keyof SettingsPayload, unknown>>>(cfg.api.settings);
        if (!cancelled && data && typeof data === "object") {
          const normalized = normalize(data);
          setValues(normalized);
          lastSavedRef.current = normalized;
          pendingIntentRef.current = normalized;
        }
      } catch { /* keep defaults */ }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [isAuthenticated]);

  const equal = (a: SettingsPayload, b: SettingsPayload) =>
    a.email_updates === b.email_updates &&
    a.profile_visibility === b.profile_visibility &&
    a.dm_privacy === b.dm_privacy &&
    a.theme === b.theme &&
    a.digest_emails === b.digest_emails;

  // Serial save loop: always sends the *latest* pendingIntent; if new changes
  // arrive mid-flight, another pass fires as soon as the current one settles.
  // This guarantees the final stored value matches the member's last selection.
  const runSaveLoop = useCallback(async () => {
    if (savingRef.current) return;
    savingRef.current = true;
    try {
      while (dirtyRef.current) {
        const attempt = pendingIntentRef.current;
        dirtyRef.current = false;
        setSaveState("saving");
        try {
          const cfg = window.TAPNE_RUNTIME_CONFIG;
          const saved = await apiPatch<Partial<Record<keyof SettingsPayload, unknown>>>(cfg.api.settings, attempt);
          const confirmed = saved && typeof saved === "object" ? normalize({ ...attempt, ...saved }) : attempt;
          lastSavedRef.current = confirmed;
          // Only overwrite optimistic values if no newer selection is queued.
          if (!dirtyRef.current) {
            setValues(confirmed);
            pendingIntentRef.current = confirmed;
            setSaveState("saved");
            if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
            savedTimerRef.current = setTimeout(() => {
              setSaveState((s) => (s === "saved" ? "idle" : s));
            }, 1600);
          }
        } catch {
          // Failed intent stays in pendingIntentRef so Retry re-applies it.
          // If a newer selection arrived during the failed save, prefer it
          // (dirtyRef is true) and continue the loop without surfacing error.
          if (!dirtyRef.current) {
            setValues(lastSavedRef.current);
            setSaveState("error");
            break;
          }
        }
      }
    } finally {
      savingRef.current = false;
    }
  }, []);

  const scheduleSave = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { runSaveLoop(); }, 450);
  }, [runSaveLoop]);

  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
  }, []);


  const loadBlocked = useCallback(async () => {
    setBlockedLoading(true);
    setBlockedError(false);
    try {
      const cfg = window.TAPNE_RUNTIME_CONFIG;
      const data = await apiGet<{ users: BlockedUser[] }>(cfg.api.blocks);
      setBlocked(data?.users || []);
    } catch {
      setBlockedError(true);
    } finally {
      setBlockedLoading(false);
    }
  }, []);

  useEffect(() => { if (isAuthenticated) loadBlocked(); }, [isAuthenticated, loadBlocked]);

  const update = <K extends keyof SettingsPayload>(key: K, val: SettingsPayload[K]) => {
    setValues((prev) => {
      const next = { ...prev, [key]: val };
      // Latest intent replaces any previously failed intent.
      pendingIntentRef.current = next;
      // Mark dirty whenever a save is in flight — even if the new selection
      // matches the last confirmed value — so the in-flight completion cannot
      // overwrite the member's newer choice. The follow-up pass re-sends the
      // latest intent so the server ends on it too.
      if (!equal(next, lastSavedRef.current) || savingRef.current) {
        dirtyRef.current = true;
        // Clear a lingering error immediately — the member has moved on.
        setSaveState((s) => (s === "error" ? "idle" : s));
        scheduleSave();
      }
      return next;
    });
  };

  const retrySave = () => {
    // Reapply the last failed intent optimistically, then re-run the loop.
    const intent = pendingIntentRef.current;
    setValues(intent);
    dirtyRef.current = true;
    setSaveState("idle");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    runSaveLoop();
  };


  const handleUnblock = async () => {
    if (!unblockTarget) return;
    setUnblocking(true);
    setUnblockError(null);
    try {
      const cfg = window.TAPNE_RUNTIME_CONFIG;
      await apiDelete(`${cfg.api.blocks}${unblockTarget.username}/`);
      toast.success(`Unblocked ${unblockTarget.display_name}.`);
      setUnblockTarget(null);
      loadBlocked();
    } catch (err: any) {
      setUnblockError(err?.error || "Could not unblock. Please try again.");
    } finally {
      setUnblocking(false);
    }
  };

  const handleDeactivate = async () => {
    setPending(true);
    setBlockers(null);
    try {
      const cfg = window.TAPNE_RUNTIME_CONFIG;
      await apiPost(cfg.api.account_deactivate, {});
      toast.success("Account deactivated. You've been signed out.");
      setDeactivateOpen(false);
      logout();
      navigate("/");
    } catch (err: any) {
      if (err?.status === 409 && Array.isArray(err?.blockers)) {
        setBlockers(err.blockers);
      } else {
        toast.error(err?.error || "Could not deactivate account. Please try again.");
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <h1 className="mb-6 flex items-center gap-2 text-2xl font-bold text-foreground">
          <SettingsIcon className="h-6 w-6" />Settings
        </h1>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />Loading settings…
          </div>
        ) : (
          <div className="space-y-6">
            {/* Emails */}
            <Card>
              <CardContent className="space-y-6 p-6">
                <h2 className="text-lg font-semibold">Emails</h2>

                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium">Email updates</Label>
                    <p className="text-xs text-muted-foreground">
                      Choose how often Tapne emails you about trip activity and messages.
                    </p>
                  </div>
                  <RadioGroup
                    value={values.email_updates}
                    onValueChange={(v) => update("email_updates", v as EmailUpdates)}
                    className="space-y-2"
                  >
                    <div className="flex items-start gap-3 rounded-md border border-border p-3">
                      <RadioGroupItem value="all" id="eu-all" className="mt-0.5" />
                      <div>
                        <Label htmlFor="eu-all" className="text-sm font-medium">All activity</Label>
                        <p className="text-xs text-muted-foreground">Every trip update, application, and message.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-md border border-border p-3">
                      <RadioGroupItem value="important" id="eu-important" className="mt-0.5" />
                      <div>
                        <Label htmlFor="eu-important" className="text-sm font-medium">Only important updates</Label>
                        <p className="text-xs text-muted-foreground">Bookings, approvals, and direct messages only.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-md border border-border p-3">
                      <RadioGroupItem value="none" id="eu-none" className="mt-0.5" />
                      <div>
                        <Label htmlFor="eu-none" className="text-sm font-medium">No email updates</Label>
                        <p className="text-xs text-muted-foreground">Turn off all activity emails.</p>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Label className="text-sm font-medium">Weekly digest</Label>
                    <p className="text-xs text-muted-foreground">
                      A weekly summary of new trips and community activity.
                    </p>
                  </div>
                  <Switch
                    checked={values.digest_emails}
                    onCheckedChange={(v) => update("digest_emails", v)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Privacy */}
            <Card>
              <CardContent className="space-y-6 p-6">
                <h2 className="text-lg font-semibold">Privacy</h2>

                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium">Profile visibility</Label>
                    <p className="text-xs text-muted-foreground">
                      Choose who can view your profile and hosted trips.
                    </p>
                  </div>
                  <RadioGroup
                    value={values.profile_visibility}
                    onValueChange={(v) => update("profile_visibility", v as ProfileVisibility)}
                    className="space-y-2"
                  >
                    <div className="flex items-start gap-3 rounded-md border border-border p-3">
                      <RadioGroupItem value="public" id="pv-public" className="mt-0.5" />
                      <div>
                        <Label htmlFor="pv-public" className="text-sm font-medium">Public</Label>
                        <p className="text-xs text-muted-foreground">Anyone on the web can view your profile.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-md border border-border p-3">
                      <RadioGroupItem value="members_only" id="pv-members" className="mt-0.5" />
                      <div>
                        <Label htmlFor="pv-members" className="text-sm font-medium">Members only</Label>
                        <p className="text-xs text-muted-foreground">Only signed-in Tapne members can view your profile.</p>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium">Who can message you</Label>
                    <p className="text-xs text-muted-foreground">
                      Controls who can start a direct message with you.
                    </p>
                  </div>
                  <RadioGroup
                    value={values.dm_privacy}
                    onValueChange={(v) => update("dm_privacy", v as DmPrivacy)}
                    className="space-y-2"
                  >
                    <div className="flex items-start gap-3 rounded-md border border-border p-3">
                      <RadioGroupItem value="everyone" id="dm-everyone" className="mt-0.5" />
                      <div>
                        <Label htmlFor="dm-everyone" className="text-sm font-medium">Everyone</Label>
                        <p className="text-xs text-muted-foreground">Any signed-in member can message you.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-md border border-border p-3">
                      <RadioGroupItem value="followers" id="dm-followers" className="mt-0.5" />
                      <div>
                        <Label htmlFor="dm-followers" className="text-sm font-medium">People you follow</Label>
                        <p className="text-xs text-muted-foreground">Only accounts you follow can message you.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-md border border-border p-3">
                      <RadioGroupItem value="no_one" id="dm-none" className="mt-0.5" />
                      <div>
                        <Label htmlFor="dm-none" className="text-sm font-medium">No one</Label>
                        <p className="text-xs text-muted-foreground">Turn off new direct messages.</p>
                      </div>
                    </div>
                  </RadioGroup>
                </div>
              </CardContent>
            </Card>

            {/* Appearance */}
            <Card>
              <CardContent className="space-y-3 p-6">
                <h2 className="text-lg font-semibold">Appearance</h2>
                <div>
                  <Label className="text-sm font-medium">Theme</Label>
                  <p className="text-xs text-muted-foreground">Choose how Tapne looks to you.</p>
                </div>
                <RadioGroup
                  value={values.theme}
                  onValueChange={(v) => update("theme", v as Theme)}
                  className="grid grid-cols-1 gap-2 sm:grid-cols-3"
                >
                  {(["system", "light", "dark"] as Theme[]).map((t) => (
                    <div key={t} className="flex items-center gap-2 rounded-md border border-border p-3">
                      <RadioGroupItem value={t} id={`theme-${t}`} />
                      <Label htmlFor={`theme-${t}`} className="text-sm capitalize">{t}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Auto-save status */}
            <div className="flex min-h-[1.5rem] justify-end text-xs" aria-live="polite">
              {saveState === "saving" && (
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />Saving…
                </span>
              )}
              {saveState === "saved" && (
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Check className="h-3.5 w-3.5 text-primary" />Saved
                </span>
              )}
              {saveState === "error" && (
                <span className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Couldn't save. Your last change was reverted.
                  <Button size="sm" variant="outline" className="h-6 px-2 py-0 text-xs" onClick={retrySave}>Retry</Button>
                </span>
              )}
            </div>


            {/* Blocked accounts */}
            <Card>
              <CardContent className="space-y-4 p-6">
                <div>
                  <h2 className="flex items-center gap-2 text-lg font-semibold">
                    <ShieldOff className="h-5 w-5" />Blocked accounts
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Blocked members can't message you or start new conversations. Existing shared trips remain visible in read-only mode until they end.
                  </p>
                </div>

                {blockedLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />Loading…
                  </div>
                ) : blockedError ? (
                  <div className="flex items-center justify-between gap-3 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
                    <span className="text-destructive">Couldn't load your blocked accounts.</span>
                    <Button size="sm" variant="outline" onClick={loadBlocked}>Retry</Button>
                  </div>
                ) : blocked.length === 0 ? (
                  <p className="text-sm text-muted-foreground">You haven't blocked anyone.</p>
                ) : (
                  <ul className="space-y-2">
                    {blocked.map((u) => (
                      <li key={u.username} className="flex items-center justify-between gap-3 rounded-md border border-border p-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={u.avatar_url || undefined} alt={u.display_name} />
                            <AvatarFallback>{u.display_name.slice(0, 1)}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{u.display_name}</p>
                            <p className="truncate text-xs text-muted-foreground">@{u.username}</p>
                          </div>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => { setUnblockError(null); setUnblockTarget(u); }}>Unblock</Button>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            {/* Danger zone */}
            <Card className="border-destructive/30">
              <CardContent className="space-y-4 p-6">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-destructive">
                  <AlertTriangle className="h-5 w-5" />Danger zone
                </h2>
                <p className="text-sm text-muted-foreground">
                  Deactivating hides your profile, trips, stories, and messages. Your account reactivates the next time you sign in successfully.
                </p>
                <div>
                  <Button variant="outline" onClick={() => { setBlockers(null); setDeactivateOpen(true); }}>
                    <PauseCircle className="mr-1.5 h-4 w-4" />Deactivate account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
      <Footer />

      <AlertDialog open={deactivateOpen} onOpenChange={(v) => { setDeactivateOpen(v); if (!v) setBlockers(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{blockers ? "Resolve trip commitments first" : "Deactivate account?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {blockers
                ? "You have active trip commitments. Please resolve each one before deactivating."
                : "Your profile, hosted trips, stories, and messages will be hidden. Signing back in reactivates your account."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {blockers && blockers.length > 0 && (
            <ul className="max-h-64 space-y-2 overflow-y-auto text-sm">
              {blockers.map((b) => (
                <li key={b.trip_id} className="rounded-md border border-border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{b.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {b.role === "host" ? "You're hosting" : "You're a traveler"}
                        {b.role === "host" && (b.pending_count != null || b.approved_count != null) && (
                          <> · {b.pending_count ?? 0} pending · {b.approved_count ?? 0} approved</>
                        )}
                        {b.role === "traveler" && b.status && <> · {b.status}</>}
                      </p>
                    </div>
                    <Button asChild size="sm" variant="outline">
                      <Link to={(b as any).manage_url || (b.role === "host" ? `/trips/${b.trip_id}/edit` : `/trips/${b.trip_id}`)}>
                        Manage <ExternalLink className="ml-1 h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>{blockers ? "Close" : "Cancel"}</AlertDialogCancel>
            {!blockers && (
              <AlertDialogAction onClick={(e) => { e.preventDefault(); handleDeactivate(); }} disabled={pending}>
                {pending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}Deactivate
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!unblockTarget} onOpenChange={(v) => { if (!v) { setUnblockTarget(null); setUnblockError(null); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unblock {unblockTarget?.display_name}?</AlertDialogTitle>
            <AlertDialogDescription>
              They'll be able to view your profile and message you again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {unblockError && (
            <p className="text-sm text-destructive">{unblockError}</p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={unblocking}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); handleUnblock(); }} disabled={unblocking}>
              {unblocking && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}{unblockError ? "Retry" : "Unblock"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Settings;
