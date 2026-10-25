import type { Airport, Cabin } from "../../api";

export type { Cabin };

export type TripType = "round_trip" | "one_way";

export type Passengers = {
  /** 12+ lat */
  adults: number;
  /** 2–11 lat */
  children: number;
  /** do 2 lat, bez własnego miejsca */
  infants: number;
};

export type SearchCriteria = {
  tripType: TripType;
  from: Airport;
  to: Airport;
  /** YYYY-MM-DD */
  departureDate: string;
  /** YYYY-MM-DD; null dla podróży w jedną stronę */
  returnDate: string | null;
  passengers: Passengers;
  cabin: Cabin;
};

export const tripTypeLabels: Record<TripType, string> = {
  round_trip: "W obie strony",
  one_way: "W jedną stronę",
};

export const cabinLabels: Record<Cabin, string> = {
  economy: "Economy",
  business: "Business",
  first: "First",
};

export const MAX_PASSENGERS = 9;
