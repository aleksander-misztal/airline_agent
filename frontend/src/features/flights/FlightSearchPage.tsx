import { useEffect, useState } from "react";
import { todayISO } from "../../lib/date";
import { useAuthStore } from "../auth/authStore";
import { FlightSearchForm } from "./FlightSearchForm";
import { RecentSearches } from "./RecentSearches";
import { ResultsPanel } from "./ResultsPanel";
import { useFlightSearchStore } from "./flightSearchStore";
import { useRecentSearchesStore } from "./recentSearchesStore";
import type { SearchCriteria } from "./types";

const EXPIRED_NOTICE = "Daty z zapisanego wyszukiwania już minęły – wybierz nowe";

type Recalled = { key: number; criteria: SearchCriteria; notice?: string };

export function FlightSearchPage() {
  const searched = useFlightSearchStore((s) => s.criteria !== null);
  const search = useFlightSearchStore((s) => s.search);
  const userId = useAuthStore((s) => s.user?.id) ?? "guest";
  const loadRecent = useRecentSearchesStore((s) => s.load);
  const addRecent = useRecentSearchesStore((s) => s.add);

  // Zapisane wyszukiwanie wraca do formularza przez nowy `key`, bo formularz sam trzyma swoje pola.
  const [recalled, setRecalled] = useState<Recalled | null>(null);

  useEffect(() => {
    loadRecent(userId);
  }, [userId, loadRecent]);

  function runSearch(criteria: SearchCriteria) {
    addRecent(criteria);
    void search(criteria);
  }

  function recall(criteria: SearchCriteria) {
    const expired = criteria.departureDate < todayISO();
    setRecalled((previous) => ({
      key: (previous?.key ?? 0) + 1,
      criteria: expired ? { ...criteria, departureDate: "", returnDate: null } : criteria,
      notice: expired ? EXPIRED_NOTICE : undefined,
    }));
    if (!expired) runSearch(criteria);
  }

  return (
    <div className={`mx-auto w-full flex-1 px-4 py-8 sm:px-6 ${searched ? "max-w-7xl" : "max-w-4xl"}`}>
      <h1 className="text-3xl font-light text-brand">Wyszukaj loty</h1>
      <p className="mt-1 text-brand-gray">Wybierz trasę, daty i liczbę pasażerów.</p>

      {/* Formularz zostaje na miejscu, więc po wyszukaniu przesuwa się w lewo i zachowuje wpisane dane. */}
      <div className={`mt-6 ${searched ? "grid items-start gap-6 lg:grid-cols-2" : ""}`}>
        <div className="space-y-6">
          <FlightSearchForm
            key={recalled?.key ?? 0}
            initial={recalled?.criteria}
            notice={recalled?.notice}
            onSearch={runSearch}
          />
          <RecentSearches onRecall={recall} />
        </div>
        <ResultsPanel />
      </div>
    </div>
  );
}
