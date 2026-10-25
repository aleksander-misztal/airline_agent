// Jedyny punkt wejścia do warstwy API – UI importuje tylko stąd.
export { authApi } from "./auth";
export { chatApi } from "./chat";
export { ApiError } from "./client";
export type * from "./types";
