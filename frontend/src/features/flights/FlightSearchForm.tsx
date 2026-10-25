import { useState, type FormEvent } from "react";
import type { Airport } from "../../api";
import { todayISO } from "../../lib/date";
import { AirportField, airportLabel } from "./AirportField";
import { PassengerStepper } from "./PassengerStepper";
import {
  cabinLabels,
  MAX_PASSENGERS,
  tripTypeLabels,
  type Cabin,
  type Passengers,
  type SearchCriteria,
  type TripType,
} from "./types";

type FormErrors = Partial<Record<"from" | "to" | "departureDate" | "returnDate", string>>;

type FlightSearchFormProps = {
  onSearch: (criteria: SearchCriteria) => void;
  /** Dzisiejsza data (YYYY-MM-DD); do testów. */
  today?: string;
};

const fieldLabelClass = "mb-1.5 block text-sm font-medium text-neutral-800";
const inputClass =
  "w-full rounded-md border border-neutral-300 bg-white px-4 py-3 text-base outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20 aria-[invalid=true]:border-red-600";

export function FlightSearchForm({ onSearch, today = todayISO() }: FlightSearchFormProps) {
  const [tripType, setTripType] = useState<TripType>("round_trip");
  const [from, setFrom] = useState<Airport | null>(null);
  const [fromText, setFromText] = useState("");
  const [to, setTo] = useState<Airport | null>(null);
  const [toText, setToText] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [passengers, setPassengers] = useState<Passengers>({ adults: 1, children: 0, infants: 0 });
  const [cabin, setCabin] = useState<Cabin>("economy");
  const [errors, setErrors] = useState<FormErrors>({});

  const roundTrip = tripType === "round_trip";
  const total = passengers.adults + passengers.children + passengers.infants;
  const hasRoom = total < MAX_PASSENGERS;

  function swapAirports() {
    setFrom(to);
    setFromText(toText);
    setTo(from);
    setToText(fromText);
  }

  function validate(): FormErrors {
    const found: FormErrors = {};
    if (!from) found.from = "Wybierz lotnisko wylotu";
    if (!to) found.to = "Wybierz lotnisko przylotu";
    else if (from && from.code === to.code) found.to = "Lotnisko przylotu musi być inne niż wylotu";

    if (!departureDate) found.departureDate = "Podaj datę wylotu";
    else if (departureDate < today) found.departureDate = "Data wylotu nie może być w przeszłości";

    if (roundTrip) {
      if (!returnDate) found.returnDate = "Podaj datę powrotu";
      else if (departureDate && returnDate < departureDate) found.returnDate = "Powrót nie może być wcześniej niż wylot";
    }
    return found;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0 || !from || !to) return;

    onSearch({
      tripType,
      from,
      to,
      departureDate,
      returnDate: roundTrip ? returnDate : null,
      passengers,
      cabin,
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="@container rounded-lg bg-white p-5 shadow-sm ring-1 ring-neutral-200 sm:p-8"
    >
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-neutral-800">Rodzaj podróży</legend>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(tripTypeLabels) as TripType[]).map((type) => (
            <label
              key={type}
              className={`flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand ${
                tripType === type ? "border-brand bg-brand-50 font-medium text-brand" : "border-neutral-300 text-neutral-700"
              }`}
            >
              <input
                type="radio"
                name="tripType"
                value={type}
                checked={tripType === type}
                onChange={() => setTripType(type)}
                className="sr-only"
              />
              {tripTypeLabels[type]}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-6 grid items-start gap-4 @lg:grid-cols-[1fr_auto_1fr]">
        <AirportField
          label="Skąd"
          text={fromText}
          selected={from}
          error={errors.from}
          onTextChange={(text) => {
            setFromText(text);
            setFrom(null);
          }}
          onSelect={(airport) => {
            setFrom(airport);
            setFromText(airportLabel(airport));
          }}
        />
        <button
          type="button"
          onClick={swapAirports}
          aria-label="Zamień lotniska"
          className="mx-auto flex size-11 cursor-pointer items-center justify-center rounded-full border border-neutral-300 text-brand transition-colors hover:border-brand hover:bg-brand-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand @lg:mt-8"
        >
          <svg viewBox="0 0 24 24" className="size-5 rotate-90 @lg:rotate-0" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M7 7h12M15 3l4 4-4 4M17 17H5M9 13l-4 4 4 4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <AirportField
          label="Dokąd"
          text={toText}
          selected={to}
          error={errors.to}
          onTextChange={(text) => {
            setToText(text);
            setTo(null);
          }}
          onSelect={(airport) => {
            setTo(airport);
            setToText(airportLabel(airport));
          }}
        />
      </div>

      <div className={`mt-4 grid gap-4 ${roundTrip ? "@md:grid-cols-2" : ""}`}>
        <div>
          <label htmlFor="departure-date" className={fieldLabelClass}>
            Data wylotu
          </label>
          <input
            id="departure-date"
            type="date"
            min={today}
            value={departureDate}
            onChange={(e) => setDepartureDate(e.target.value)}
            aria-invalid={!!errors.departureDate}
            aria-describedby={errors.departureDate ? "departure-date-error" : undefined}
            className={inputClass}
          />
          {errors.departureDate && (
            <p id="departure-date-error" className="mt-1.5 text-sm text-red-700">
              {errors.departureDate}
            </p>
          )}
        </div>

        {roundTrip && (
          <div>
            <label htmlFor="return-date" className={fieldLabelClass}>
              Data powrotu
            </label>
            <input
              id="return-date"
              type="date"
              min={departureDate || today}
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
              aria-invalid={!!errors.returnDate}
              aria-describedby={errors.returnDate ? "return-date-error" : undefined}
              className={inputClass}
            />
            {errors.returnDate && (
              <p id="return-date-error" className="mt-1.5 text-sm text-red-700">
                {errors.returnDate}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="mt-6 grid gap-6 @2xl:grid-cols-[1.4fr_1fr]">
        <fieldset className="space-y-3">
          <legend className="mb-2 text-sm font-medium text-neutral-800">Pasażerowie</legend>
          <PassengerStepper
            label="Dorośli"
            hint="12+ lat"
            value={passengers.adults}
            canDecrease={passengers.adults > 1 && passengers.adults > passengers.infants}
            canIncrease={hasRoom}
            onChange={(adults) => setPassengers({ ...passengers, adults })}
          />
          <PassengerStepper
            label="Dzieci"
            hint="2–11 lat"
            value={passengers.children}
            canDecrease={passengers.children > 0}
            canIncrease={hasRoom}
            onChange={(children) => setPassengers({ ...passengers, children })}
          />
          <PassengerStepper
            label="Niemowlęta"
            hint="do 2 lat"
            value={passengers.infants}
            canDecrease={passengers.infants > 0}
            canIncrease={hasRoom && passengers.infants < passengers.adults}
            onChange={(infants) => setPassengers({ ...passengers, infants })}
          />
        </fieldset>

        <div>
          <label htmlFor="cabin" className={fieldLabelClass}>
            Klasa podróży
          </label>
          <select id="cabin" value={cabin} onChange={(e) => setCabin(e.target.value as Cabin)} className={inputClass}>
            {(Object.keys(cabinLabels) as Cabin[]).map((value) => (
              <option key={value} value={value}>
                {cabinLabels[value]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="submit"
        className="mt-8 w-full cursor-pointer rounded-full bg-brand px-8 py-3 text-base font-medium text-white transition-colors hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:w-auto"
      >
        Szukaj lotów
      </button>
    </form>
  );
}
