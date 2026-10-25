import type { ReactNode } from "react";
import { Footer } from "./Footer";
import { Header } from "./Header";
import type { User } from "../api";

type AppLayoutProps = {
  user?: User | null;
  onLogout?: () => void;
  children: ReactNode;
};

export function AppLayout({ user, onLogout, children }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header user={user} onLogout={onLogout} />
      <main className="flex flex-1 flex-col">{children}</main>
      <Footer />
    </div>
  );
}
