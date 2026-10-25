import type { ReactNode } from "react";
import { Footer } from "./Footer";
import { Header } from "./Header";
import type { User } from "../api";

type AppLayoutProps = {
  user?: User | null;
  avios?: number | null;
  onLogout?: () => void;
  children: ReactNode;
};

export function AppLayout({ user, avios, onLogout, children }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header user={user} avios={avios} onLogout={onLogout} />
      <main className="flex flex-1 flex-col">{children}</main>
      <Footer />
    </div>
  );
}
