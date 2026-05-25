import { useEffect, type ReactNode } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Route guard: signed-out visitors never see protected pages.
 * Opens the global login modal and redirects to "/" so the protected page
 * does not render behind the popup. On successful sign-in, sends the
 * visitor back to the originally requested URL.
 */
const RequireAuth = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, requireAuth } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      const target = location.pathname + location.search + location.hash;
      requireAuth(() => navigate(target, { replace: true }));
    }
  }, [isAuthenticated, location.pathname, location.search, location.hash]);

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

export default RequireAuth;
