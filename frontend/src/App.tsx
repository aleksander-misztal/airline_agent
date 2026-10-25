import { useEffect } from "react";
import { Navigate, Outlet, Route, Routes } from "react-router";
import { AppLayout } from "./components/AppLayout";
import { LoginPage } from "./features/auth/LoginPage";
import { ProtectedRoute } from "./features/auth/ProtectedRoute";
import { useAuthStore } from "./features/auth/authStore";
import { ChatPage } from "./features/chat/ChatPage";
import { useChatStore } from "./features/chat/chatStore";
import { DashboardPage } from "./features/dashboard/DashboardPage";
import { useDashboardStore } from "./features/dashboard/dashboardStore";
import { FlightSearchPage } from "./features/flights/FlightSearchPage";

function RootLayout() {
  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);
  const init = useAuthStore((s) => s.init);
  const logout = useAuthStore((s) => s.logout);
  const avios = useDashboardStore((s) => s.summary?.avios);
  const loadDashboard = useDashboardStore((s) => s.load);

  useEffect(() => {
    void init();
  }, [init]);

  // Dane konta (m.in. Avios w pasku) ładują się po zalogowaniu; wylogowanie i wygaśnięcie sesji czyszczą czat i dane.
  useEffect(() => {
    if (status === "authenticated") {
      void loadDashboard();
    } else if (status === "anonymous") {
      useChatStore.getState().reset();
      useDashboardStore.getState().reset();
    }
  }, [status, loadDashboard]);

  return (
    <AppLayout user={user} avios={avios} onLogout={() => void logout()}>
      <Outlet />
    </AppLayout>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/flights" element={<FlightSearchPage />} />
          <Route path="/chat" element={<ChatPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}
