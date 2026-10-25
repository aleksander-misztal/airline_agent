import { useState } from "react";
import { FlightSearchForm } from "./FlightSearchForm";
import { SearchSummary } from "./SearchSummary";
import type { SearchCriteria } from "./types";

export function FlightSearchPage() {
  const [criteria, setCriteria] = useState<SearchCriteria | null>(null);

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-light text-brand">Wyszukaj loty</h1>
      <p className="mt-1 text-brand-gray">Wybierz trasę, daty i liczbę pasażerów.</p>

      <div className="mt-6 space-y-6">
        <FlightSearchForm onSearch={setCriteria} />
        {criteria && <SearchSummary criteria={criteria} />}
      </div>
    </div>
  );
}
