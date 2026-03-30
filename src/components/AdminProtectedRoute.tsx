import { Navigate, Outlet, useLocation } from "react-router-dom";
import { LayoutDashboard } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

/**
 * Requires authentication and `role === "admin"`.
 * Renders a dedicated admin shell (no shared user navigation).
 */
const AdminProtectedRoute = () => {
  const { user, initializing, logout } = useAuth();
  const location = useLocation();

  if (initializing) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  }

  if (user.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="h-6 w-6 text-primary" />
            <span className="font-semibold text-foreground">Easy Health Admin</span>
            <span className="text-sm text-muted-foreground">OKR dashboard</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => logout()}>
            Log out
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminProtectedRoute;
