import { Link, NavLink } from "react-router";
import { brand } from "../config/brand";
import { formatNumber } from "../lib/format";
import type { User } from "../api";

type HeaderProps = {
  user?: User | null;
  /** Saldo punktów; null/undefined = jeszcze nie wczytane. */
  avios?: number | null;
  onLogout?: () => void;
};

const tabClass = ({ isActive }: { isActive: boolean }) =>
  `border-b-2 px-1 py-3 text-sm font-medium transition-colors ${
    isActive ? "border-brand text-brand" : "border-transparent text-neutral-600 hover:text-brand"
  }`;

export function Header({ user, avios, onLogout }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 px-4 sm:px-6">
        <div className="flex h-16 items-center gap-4 sm:h-20">
          <Link to="/" aria-label={brand.name}>
            <img src={brand.logo.full} alt={brand.name} className="h-9 w-auto sm:h-11" />
          </Link>
          <span className="hidden border-l border-neutral-300 pl-4 text-sm font-light tracking-wide text-brand-gray xl:block">
            {brand.assistantName}
          </span>
        </div>

        {user && (
          <nav
            aria-label="Główna nawigacja"
            className="order-last flex w-full gap-5 sm:gap-6 border-t border-neutral-100 md:order-none md:w-auto md:border-t-0"
          >
            <NavLink to="/dashboard" className={tabClass}>
              Dashboard
            </NavLink>
            <NavLink to="/flights" className={tabClass}>
              Wyszukaj loty
            </NavLink>
            <NavLink to="/chat" className={tabClass}>
              Asystent
            </NavLink>
          </nav>
        )}

        {user && (
          <div className="flex items-center gap-3 sm:gap-5">
            {avios != null && (
              <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium whitespace-nowrap text-brand sm:text-sm">
                {`${formatNumber(avios)} Avios`}
              </span>
            )}
            <span className="hidden text-sm text-neutral-700 lg:inline">{user.displayName}</span>
            <button
              type="button"
              onClick={onLogout}
              className="cursor-pointer rounded-full border border-brand px-4 py-2 text-sm font-medium text-brand transition-colors hover:bg-brand hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:px-5"
            >
              Wyloguj
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
