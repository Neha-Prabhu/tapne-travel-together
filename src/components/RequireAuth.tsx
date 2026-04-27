import { useEffect, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Route guard: signed-out visitors never see protected pages.
 * Opens the global login modal and redirects to "/" so the protected page
 * does not render behind the popup.
 */
const RequireAuth = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, requireAuth } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!isAuthenticated) requireAuth();
  }, [isAuthenticated, location.pathname]);

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

export default RequireAuth;
