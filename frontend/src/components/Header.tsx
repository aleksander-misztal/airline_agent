import { Link } from "react-router";
import { brand } from "../config/brand";
import type { User } from "../api";

type HeaderProps = {
  user?: User | null;
  onLogout?: () => void;
};

export function Header({ user, onLogout }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:h-20 sm:px-6">
        <div className="flex items-center gap-4">
          <Link to="/" aria-label={brand.name}>
            <img src={brand.logo.full} alt={brand.name} className="h-9 w-auto sm:h-11" />
          </Link>
          <span className="hidden border-l border-neutral-300 pl-4 text-sm font-light tracking-wide text-brand-gray md:block">
            {brand.assistantName}
          </span>
        </div>

        {user && (
          <div className="flex items-center gap-3 sm:gap-5">
            <span className="hidden text-sm text-neutral-700 sm:inline">{user.displayName}</span>
            <button
              type="button"
              onClick={onLogout}
              className="cursor-pointer rounded-full border border-brand px-5 py-2 text-sm font-medium text-brand transition-colors hover:bg-brand hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              Wyloguj
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
