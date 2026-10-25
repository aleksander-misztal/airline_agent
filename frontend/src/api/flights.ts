import { request } from "./client";
import type { FlightSearchParams, FlightSearchResult } from "./types";

export const flightsApi = {
  search(params: FlightSearchParams) {
    const query = new URLSearchParams({
      from: params.from,
      to: params.to,
      departureDate: params.departureDate,
      adults: String(params.adults),
      children: String(params.children),
      infants: String(params.infants),
      cabin: params.cabin,
    });
    if (params.returnDate) query.set("returnDate", params.returnDate);
    return request<FlightSearchResult>(`/api/flights/search?${query}`);
  },
};
