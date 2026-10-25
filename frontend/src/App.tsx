import { useEffect } from "react";
import { Navigate, Outlet, Route, Routes } from "react-router";
import { AppLayout } from "./components/AppLayout";
import { LoginPage } from "./features/auth/LoginPage";
import { ProtectedRoute } from "./features/auth/ProtectedRoute";
import { useAuthStore } from "./features/auth/authStore";
import { ChatPage } from "./features/chat/ChatPage";
import { useChatStore } from "./features/chat/chatStore";

function RootLayout() {
  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);
  const init = useAuthStore((s) => s.init);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    void init();
  }, [init]);

  // Wylogowanie i wygaśnięcie sesji czyszczą otwarty czat.
  useEffect(() => {
    if (status === "anonymous") useChatStore.getState().reset();
  }, [status]);

  return (
    <AppLayout user={user} onLogout={() => void logout()}>
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
          <Route path="/chat" element={<ChatPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/chat" replace />} />
      </Route>
    </Routes>
  );
}
