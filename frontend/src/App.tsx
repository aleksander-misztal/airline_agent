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
  const init = useAuthStore((s) => s.init);
  const logout = useAuthStore((s) => s.logout);

  async function handleLogout() {
    await logout();
    useChatStore.getState().reset();
  }

  useEffect(() => {
    void init();
  }, [init]);

  return (
    <AppLayout user={user} onLogout={() => void handleLogout()}>
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
