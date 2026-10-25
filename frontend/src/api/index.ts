// Jedyny punkt wejścia do warstwy API – UI importuje tylko stąd.
export { authApi } from "./auth";
export { chatApi } from "./chat";
export { dashboardApi } from "./dashboard";
export { ApiError, setUnauthorizedHandler } from "./client";
export type * from "./types";
