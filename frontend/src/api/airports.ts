import { request } from "./client";
import type { Airport } from "./types";

export const airportsApi = {
  /** Podpowiedzi po mieście, kodzie IATA lub nazwie; pusta fraza = najpopularniejsze. */
  search: (q: string) => request<Airport[]>(`/api/airports?q=${encodeURIComponent(q)}`),
};
