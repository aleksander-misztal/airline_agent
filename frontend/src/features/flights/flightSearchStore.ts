import { create } from "zustand";
import { bookingsApi, flightsApi, type FlightOffer, type FlightSearchParams } from "../../api";
import { useDashboardStore } from "../dashboard/dashboardStore";
import type { SearchCriteria } from "./types";

export type SortKey = "price" | "duration" | "departure";
type SearchStatus = "idle" | "loading" | "ready" | "error";

const SEARCH_ERROR = "Nie udało się wyszukać lotów. Spróbuj ponownie.";
const RESERVE_ERROR = "Nie udało się zarezerwować lotu. Spróbuj ponownie.";

let searchSeq = 0;

type FlightSearchState = {
  criteria: SearchCriteria | null;
  status: SearchStatus;
  error: string | null;
  offers: FlightOffer[];
  sort: SortKey;
  directOnly: boolean;
  /** Rozwinięta oferta; naraz tylko jedna. */
  expandedId: string | null;
  /** offerId → kod rezerwacji */
  reservations: Record<string, string>;
  reservingId: string | null;
  reserveError: { offerId: string; message: string } | null;
  search: (criteria: SearchCriteria) => Promise<void>;
  setSort: (sort: SortKey) => void;
  setDirectOnly: (directOnly: boolean) => void;
  toggleOffer: (offerId: string) => void;
  /** Zwraca true, gdy rezerwacja się udała. */
  reserve: (offerId: string) => Promise<boolean>;
  reset: () => void;
};

const toParams = (c: SearchCriteria): FlightSearchParams => ({
  from: c.from.code,
  to: c.to.code,
  departureDate: c.departureDate,
  returnDate: c.returnDate,
  adults: c.passengers.adults,
  children: c.passengers.children,
  infants: c.passengers.infants,
  cabin: c.cabin,
});

const totalDuration = (offer: FlightOffer) => offer.legs.reduce((sum, leg) => sum + leg.durationMinutes, 0);
const firstDeparture = (offer: FlightOffer) => Date.parse(offer.legs[0].segments[0].departure);
const isDirect = (offer: FlightOffer) => offer.legs.every((leg) => leg.segments.length === 1);

const sorters: Record<SortKey, (a: FlightOffer, b: FlightOffer) => number> = {
  price: (a, b) => a.price.amount - b.price.amount,
  duration: (a, b) => totalDuration(a) - totalDuration(b),
  departure: (a, b) => firstDeparture(a) - firstDeparture(b),
};

/** Oferty po filtrze i sortowaniu; remisy rozstrzyga cena, potem identyfikator. */
export function selectVisibleOffers({
  offers,
  sort,
  directOnly,
}: Pick<FlightSearchState, "offers" | "sort" | "directOnly">): FlightOffer[] {
  const compare = sorters[sort];
  return offers
    .filter((offer) => !directOnly || isDirect(offer))
    .sort((a, b) => compare(a, b) || sorters.price(a, b) || a.id.localeCompare(b.id));
}

const initial = {
  criteria: null,
  status: "idle" as SearchStatus,
  error: null,
  offers: [] as FlightOffer[],
  sort: "price" as SortKey,
  directOnly: false,
  expandedId: null,
  reservations: {} as Record<string, string>,
  reservingId: null,
  reserveError: null,
};

export const useFlightSearchStore = create<FlightSearchState>()((set, get) => ({
  ...initial,

  async search(criteria) {
    const request = ++searchSeq;
    set({ criteria, status: "loading", error: null, offers: [], expandedId: null, reserveError: null });
    try {
      const { offers } = await flightsApi.search(toParams(criteria));
      if (request === searchSeq) set({ offers, status: "ready" });
    } catch {
      if (request === searchSeq) set({ offers: [], status: "error", error: SEARCH_ERROR });
    }
  },

  setSort: (sort) => set({ sort }),
  setDirectOnly: (directOnly) => set({ directOnly }),
  toggleOffer: (offerId) => set((s) => ({ expandedId: s.expandedId === offerId ? null : offerId })),

  async reserve(offerId) {
    const { criteria, reservingId } = get();
    if (!criteria || reservingId) return false;

    set({ reservingId: offerId, reserveError: null });
    try {
      const { reference } = await bookingsApi.create({ offerId, search: toParams(criteria) });
      set((s) => ({ reservations: { ...s.reservations, [offerId]: reference }, reservingId: null }));
      void useDashboardStore.getState().load(); // nowa rezerwacja ma być od razu widoczna na Dashboardzie
      return true;
    } catch {
      set({ reservingId: null, reserveError: { offerId, message: RESERVE_ERROR } });
      return false;
    }
  },

  reset() {
    searchSeq += 1; // spóźniona odpowiedź nie wróci po wylogowaniu
    set({ ...initial, reservations: {} });
  },
}));
