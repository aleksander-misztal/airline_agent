import { FlightSearchForm } from "./FlightSearchForm";
import { ResultsPanel } from "./ResultsPanel";
import { useFlightSearchStore } from "./flightSearchStore";

export function FlightSearchPage() {
  const searched = useFlightSearchStore((s) => s.criteria !== null);
  const search = useFlightSearchStore((s) => s.search);

  return (
    <div className={`mx-auto w-full flex-1 px-4 py-8 sm:px-6 ${searched ? "max-w-7xl" : "max-w-4xl"}`}>
      <h1 className="text-3xl font-light text-brand">Wyszukaj loty</h1>
      <p className="mt-1 text-brand-gray">Wybierz trasę, daty i liczbę pasażerów.</p>

      {/* Formularz zostaje na miejscu (ten sam węzeł), więc po wyszukaniu przesuwa się w lewo i zachowuje wpisane dane. */}
      <div className={`mt-6 ${searched ? "grid items-start gap-6 lg:grid-cols-2" : ""}`}>
        <FlightSearchForm onSearch={(criteria) => void search(criteria)} />
        <ResultsPanel />
      </div>
    </div>
  );
}
