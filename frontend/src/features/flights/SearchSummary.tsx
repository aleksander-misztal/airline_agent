import { dateOf } from "../../lib/format";
import { describePassengers } from "../../lib/passengers";
import { airportLabel } from "./AirportField";
import { cabinLabels, tripTypeLabels, type SearchCriteria } from "./types";

export function SearchSummary({ criteria }: { criteria: SearchCriteria }) {
  const { tripType, from, to, departureDate, returnDate, passengers, cabin } = criteria;
  const dates = returnDate ? `${dateOf(departureDate)} – ${dateOf(returnDate)}` : dateOf(departureDate);

  return (
    <section aria-label="Kryteria wyszukiwania" className="border-b border-neutral-200 pb-5">
      <p className="text-xl font-light text-brand">{`${airportLabel(from)} → ${airportLabel(to)}`}</p>
      <dl className="mt-3 flex flex-wrap gap-x-8 gap-y-2 text-sm text-neutral-700">
        <div>
          <dt className="sr-only">Rodzaj podróży</dt>
          <dd>{tripTypeLabels[tripType]}</dd>
        </div>
        <div>
          <dt className="sr-only">Daty</dt>
          <dd>{dates}</dd>
        </div>
        <div>
          <dt className="sr-only">Pasażerowie</dt>
          <dd>{describePassengers(passengers)}</dd>
        </div>
        <div>
          <dt className="sr-only">Klasa podróży</dt>
          <dd>{cabinLabels[cabin]}</dd>
        </div>
      </dl>
    </section>
  );
}
