import { Navigate, Outlet, useLocation } from "react-router-dom";
import AppHeader from "@/components/AppHeader";
import { useAuth } from "@/contexts/AuthContext";

/** Standard user-facing layout: shared header + route content (not used for `/admin`). */
const AppShell = () => {
  const { user, initializing } = useAuth();
  const location = useLocation();

  if (!initializing && user?.role === "admin") {
    return <Navigate to="/admin" replace state={{ from: location.pathname }} />;
  }

  return (
    <>
      <AppHeader />
      <Outlet />
    </>
  );
};

export default AppShell;
