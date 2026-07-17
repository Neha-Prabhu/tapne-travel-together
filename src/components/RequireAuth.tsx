import { useEffect, type ReactNode } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

/**
 * Route guard: signed-out visitors never see protected pages.
 *
 * Waits for initial auth restoration (`authReady`) before deciding.
 * While restoring, renders a neutral loading state so a signed-in
 * member who hard-refreshes never sees a Home/login-modal flash.
 * Once ready and still signed-out, opens the global login modal and
 * redirects to "/" so the protected page does not render behind the
 * popup. On successful sign-in, sends the visitor back to the
 * originally requested URL.
 */
const RequireAuth = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, authReady, requireAuth } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (authReady && !isAuthenticated) {
      const target = location.pathname + location.search + location.hash;
      requireAuth(() => navigate(target, { replace: true }));
    }
  }, [authReady, isAuthenticated, location.pathname, location.search, location.hash]);

  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

export default RequireAuth;
