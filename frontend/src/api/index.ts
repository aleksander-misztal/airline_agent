// Jedyny punkt wejścia do warstwy API – UI importuje tylko stąd.
export { airportsApi } from "./airports";
export { authApi } from "./auth";
export { bookingsApi } from "./bookings";
export { chatApi } from "./chat";
export { dashboardApi } from "./dashboard";
export { flightsApi } from "./flights";
export { ApiError, setUnauthorizedHandler } from "./client";
export type * from "./types";
