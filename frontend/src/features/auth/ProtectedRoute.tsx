import { Navigate, Outlet } from "react-router";
import { PageLoader } from "../../components/PageLoader";
import { useAuthStore } from "./authStore";

export function ProtectedRoute() {
  const status = useAuthStore((s) => s.status);

  if (status === "loading") return <PageLoader />;
  if (status === "anonymous") return <Navigate to="/login" replace />;
  return <Outlet />;
}
