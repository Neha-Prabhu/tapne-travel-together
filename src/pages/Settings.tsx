import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/contexts/AuthContext";
import { apiGet, apiPatch, apiPost } from "@/lib/api";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, AlertTriangle, PauseCircle, Trash2, SettingsIcon } from "lucide-react";

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
  const [saving, setSaving] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pending, setPending] = useState(false);

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
          setValues(normalize(data));
        }
      } catch {
        // keep defaults
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isAuthenticated]);

  const update = <K extends keyof SettingsPayload>(key: K, val: SettingsPayload[K]) => {
    setValues((prev) => ({ ...prev, [key]: val }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const cfg = window.TAPNE_RUNTIME_CONFIG;
      const saved = await apiPatch<Partial<Record<keyof SettingsPayload, unknown>>>(cfg.api.settings, values);
      if (saved && typeof saved === "object") setValues(normalize({ ...values, ...saved }));
      toast.success("Settings saved.");
    } catch {
      toast.error("Could not save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async () => {
    setPending(true);
    try {
      const cfg = window.TAPNE_RUNTIME_CONFIG;
      await apiPost(cfg.api.account_deactivate, {});
      toast.success("Account deactivated.");
      logout();
      navigate("/");
    } catch {
      toast.error("Could not deactivate account. Please try again.");
    } finally {
      setPending(false);
    }
  };

  const handleDelete = async () => {
    setPending(true);
    try {
      const cfg = window.TAPNE_RUNTIME_CONFIG;
      await apiPost(cfg.api.account_delete, {});
      toast.success("Account deleted.");
      logout();
      navigate("/");
    } catch {
      toast.error("Could not delete account. Please try again.");
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

            {/* Save */}
            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}Save changes
              </Button>
            </div>

            {/* Danger zone */}
            <Card className="border-destructive/30">
              <CardContent className="space-y-4 p-6">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-destructive">
                  <AlertTriangle className="h-5 w-5" />Danger zone
                </h2>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => setDeactivateOpen(true)}>
                    <PauseCircle className="mr-1.5 h-4 w-4" />Deactivate account
                  </Button>
                  <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
                    <Trash2 className="mr-1.5 h-4 w-4" />Delete permanently
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
      <Footer />

      <AlertDialog open={deactivateOpen} onOpenChange={setDeactivateOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate account?</AlertDialogTitle>
            <AlertDialogDescription>Your profile will be hidden. You can reactivate by logging back in.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeactivate} disabled={pending}>
              {pending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete account permanently?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone. All your trips, stories, and messages will be removed.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={pending} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {pending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}Delete permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Settings;
