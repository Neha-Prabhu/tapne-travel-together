import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

type Step = "form" | "verify";

const LoginModal = ({ open, onOpenChange, onSuccess }: LoginModalProps) => {
  const { login, signup, verifySignupCode, resendSignupCode, lastAuthError } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [step, setStep] = useState<Step>("form");
  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Verify step state
  const [pendingEmail, setPendingEmail] = useState("");
  const [code, setCode] = useState<string[]>(["", "", "", "", "", ""]);
  const [verifyError, setVerifyError] = useState("");
  const [resendIn, setResendIn] = useState(60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const reset = () => {
    setName(""); setIdentifier(""); setPassword("");
    setError(""); setVerifyError(""); setLoading(false);
    setStep("form"); setPendingEmail(""); setCode(["", "", "", "", "", ""]);
  };

  useEffect(() => {
    if (step !== "verify") return;
    setResendIn(60);
    const t = setInterval(() => setResendIn((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [step]);

  const googleOAuthUrl = (window as any).TAPNE_RUNTIME_CONFIG?.google_oauth_url as string | undefined;
  const hasGoogle = !!googleOAuthUrl;

  const handleGoogleAuth = () => {
    if (googleOAuthUrl) {
      window.location.href = googleOAuthUrl + "?next=" + encodeURIComponent(window.location.pathname);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "signup" && !name) { setError("Name is required"); return; }
    if (!identifier || !password) { setError("All fields are required"); return; }
    if (mode === "signup" && password.length < 6) { setError("Password must be at least 6 characters"); return; }

    setLoading(true);
    setError("");

    if (mode === "login") {
      const ok = await login(identifier, password);
      setLoading(false);
      if (ok) { onOpenChange(false); onSuccess?.(); reset(); }
      else if (lastAuthError === "__suspended__") setError("__suspended__");
      else setError(lastAuthError || "Invalid credentials");
      return;
    }


    const result = await signup(name, identifier, password);
    setLoading(false);
    if (result.status === "verified") {
      onOpenChange(false); onSuccess?.(); reset();
    } else if (result.status === "pending") {
      setPendingEmail(result.email);
      setStep("verify");
    } else {
      setError(result.error || "Something went wrong");
    }
  };

  const setCodeAt = (i: number, v: string) => {
    const digits = v.replace(/\D/g, "");
    if (digits.length > 1) {
      // paste
      const next = ["", "", "", "", "", ""];
      digits.slice(0, 6).split("").forEach((d, idx) => (next[idx] = d));
      setCode(next);
      const focusIdx = Math.min(digits.length, 5);
      inputRefs.current[focusIdx]?.focus();
      return;
    }
    setCode((prev) => {
      const next = [...prev]; next[i] = digits; return next;
    });
    if (digits && i < 5) inputRefs.current[i + 1]?.focus();
  };

  const handleVerify = async () => {
    const joined = code.join("");
    if (joined.length !== 6) { setVerifyError("Enter all 6 digits."); return; }
    setLoading(true); setVerifyError("");
    // Pass the currently displayed name/email/password so verification creates
    // the account with those values (not stale pending data on the server).
    const r = await verifySignupCode(joined, { name, email: identifier, password });
    setLoading(false);
    if (r.ok) { onOpenChange(false); onSuccess?.(); reset(); return; }
    if (r.reason === "expired") setVerifyError("Code expired. Request a new one.");
    else if (r.reason === "too_many_attempts") setVerifyError("Too many attempts. Request a new code.");
    else if (r.reason === "delivery_failed") setVerifyError("We couldn't deliver the code. Check your email and try Resend.");
    else setVerifyError("Invalid code. Please try again.");
  };

  const handleResend = async () => {
    if (resendIn > 0) return;
    setVerifyError("");
    // Resend targets the currently displayed email; server keeps the 10-minute
    // challenge lifetime and 60-second cooldown.
    const r = await resendSignupCode({ name, email: identifier, password });
    if (r.ok) { setResendIn(60); setCode(["", "", "", "", "", ""]); setPendingEmail(identifier); inputRefs.current[0]?.focus(); }
    else setVerifyError(r.error || "Could not resend code. Please try again.");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="sm:max-w-sm">
        <VisuallyHidden>
          <DialogTitle>{step === "verify" ? "Verify your email" : mode === "login" ? "Log in to Tapne" : "Create your Tapne account"}</DialogTitle>
          <DialogDescription>
            {step === "verify" ? "Enter the six-digit code we sent to your email." : mode === "login" ? "Sign in to your Tapne account to continue." : "Create a new Tapne account to get started."}
          </DialogDescription>
        </VisuallyHidden>

        {step === "form" && (
          <div className="space-y-4">
            <div className="text-center">
              <h2 className="text-xl font-bold text-foreground">
                {mode === "login" ? "Welcome back" : "Create your account"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {mode === "login" ? "Log in to continue" : "Start your journey with Tapne"}
              </p>
            </div>

            {hasGoogle && (
              <>
                <Button variant="outline" className="w-full gap-2" onClick={handleGoogleAuth} disabled={loading}>
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Continue with Google
                </Button>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">or</span>
                  </div>
                </div>
              </>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              {mode === "signup" && (
                <div>
                  <Label className="mb-1.5 block text-sm">Full Name</Label>
                  <Input placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
              )}
              <div>
                <Label className="mb-1.5 block text-sm">{mode === "login" ? "Username or Email" : "Email"}</Label>
                <Input type="text" placeholder={mode === "login" ? "username or email" : "you@example.com"} value={identifier} onChange={(e) => setIdentifier(e.target.value)} />
              </div>
              <div>
                <Label className="mb-1.5 block text-sm">Password</Label>
                <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              {error === "__suspended__" ? (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                  This account has been suspended. Contact{" "}
                  <a href="mailto:support@tapnetravel.com" className="underline font-medium">support@tapnetravel.com</a>
                  {" "}if you believe this was a mistake.
                </div>
              ) : error ? <p className="text-sm text-destructive">{error}</p> : null}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {mode === "login" ? "Log In" : "Sign Up"}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              {mode === "login" ? "Don't have an account? " : "Already have an account? "}
              <button
                type="button"
                className="font-medium text-primary hover:underline"
                onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}
              >
                {mode === "login" ? "Sign up" : "Log in"}
              </button>
            </p>
          </div>
        )}

        {step === "verify" && (
          <div className="space-y-4">
            <div className="text-center">
              <h2 className="text-xl font-bold text-foreground">Verify your email</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                We sent a 6-digit code to <span className="font-medium text-foreground">{pendingEmail}</span>. It expires in 10 minutes.
              </p>
            </div>

            <div className="flex justify-center gap-2" onPaste={(e) => {
              const text = e.clipboardData.getData("text");
              if (/^\d/.test(text)) { e.preventDefault(); setCodeAt(0, text); }
            }}>
              {code.map((d, i) => (
                <Input
                  key={i}
                  ref={(el) => (inputRefs.current[i] = el)}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={1}
                  value={d}
                  onChange={(e) => setCodeAt(i, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Backspace" && !code[i] && i > 0) inputRefs.current[i - 1]?.focus();
                  }}
                  className="h-11 w-10 text-center text-lg"
                  disabled={loading}
                />
              ))}
            </div>

            {verifyError && <p className="text-center text-sm text-destructive">{verifyError}</p>}

            <Button className="w-full" onClick={handleVerify} disabled={loading || code.join("").length !== 6}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Verify and continue
            </Button>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <button
                type="button"
                className="hover:underline"
                onClick={() => setStep("form")}
                disabled={loading}
              >
                Edit details
              </button>
              <button
                type="button"
                className="text-primary hover:underline disabled:text-muted-foreground disabled:no-underline"
                onClick={handleResend}
                disabled={loading || resendIn > 0}
              >
                {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend code"}
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default LoginModal;
