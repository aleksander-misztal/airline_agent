import { create } from "zustand";
import type { SearchCriteria } from "./types";

const MAX_ITEMS = 5;
const storageKey = (userId: string) => `recent-searches:${userId}`;

export type RecentSearch = { id: string; criteria: SearchCriteria };

/** To samo wyszukiwanie (trasa, daty, pasażerowie, klasa) = ten sam identyfikator. */
export const searchId = (c: SearchCriteria) =>
  [c.tripType, c.from.code, c.to.code, c.departureDate, c.returnDate ?? "", c.passengers.adults, c.passengers.children, c.passengers.infants, c.cabin].join("|");

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;
const isAirport = (value: unknown) =>
  isRecord(value) && ["code", "city", "country", "name"].every((key) => typeof value[key] === "string");
const isCount = (value: unknown) => Number.isInteger(value) && (value as number) >= 0;

// Dane z localStorage mogły zostać zmienione lub pochodzić ze starszej wersji, więc sprawdzamy ich kształt.
function isCriteria(value: unknown): value is SearchCriteria {
  if (!isRecord(value)) return false;
  const { passengers } = value;
  return (
    (value.tripType === "round_trip" || value.tripType === "one_way") &&
    isAirport(value.from) &&
    isAirport(value.to) &&
    typeof value.departureDate === "string" &&
    (value.returnDate === null || typeof value.returnDate === "string") &&
    isRecord(passengers) &&
    isCount(passengers.adults) &&
    isCount(passengers.children) &&
    isCount(passengers.infants) &&
    (value.cabin === "economy" || value.cabin === "business" || value.cabin === "first")
  );
}

function read(userId: string): RecentSearch[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(storageKey(userId)) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(isCriteria)
      .slice(0, MAX_ITEMS)
      .map((criteria) => ({ id: searchId(criteria), criteria }));
  } catch {
    return [];
  }
}

function write(userId: string | null, items: RecentSearch[]) {
  if (!userId) return;
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(items.map((item) => item.criteria)));
  } catch {
    // brak miejsca albo zablokowany storage – historia działa wtedy tylko do odświeżenia strony
  }
}

type RecentSearchesState = {
  userId: string | null;
  items: RecentSearch[];
  /** Wczytuje historię danego użytkownika (osobna dla każdego). */
  load: (userId: string) => void;
  add: (criteria: SearchCriteria) => void;
  remove: (id: string) => void;
  clear: () => void;
  /** Czyści tylko pamięć aplikacji (np. przy wylogowaniu); zapisana historia zostaje. */
  reset: () => void;
};

export const useRecentSearchesStore = create<RecentSearchesState>()((set, get) => ({
  userId: null,
  items: [],

  load(userId) {
    set({ userId, items: read(userId) });
  },

  add(criteria) {
    const item = { id: searchId(criteria), criteria };
    const items = [item, ...get().items.filter((existing) => existing.id !== item.id)].slice(0, MAX_ITEMS);
    set({ items });
    write(get().userId, items);
  },

  remove(id) {
    const items = get().items.filter((item) => item.id !== id);
    set({ items });
    write(get().userId, items);
  },

  clear() {
    set({ items: [] });
    write(get().userId, []);
  },

  reset() {
    set({ userId: null, items: [] });
  },
}));
