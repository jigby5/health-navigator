import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const ProtectedRoute = () => {
  const { user, initializing, enrollmentLoading, hasEnrollment } = useAuth();
  const location = useLocation();
  const selectPlanPath = "/select-plan";

  if (initializing) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center text-muted-foreground">
        Loading your account...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  }

  if (user.role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  if (enrollmentLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center text-muted-foreground">
        Loading your coverage...
      </div>
    );
  }

  if (!hasEnrollment && location.pathname !== selectPlanPath) {
    return <Navigate to={selectPlanPath} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
