import { request } from "./client";
import type { BookingConfirmation, BookingRequest } from "./types";

export const bookingsApi = {
  create: (body: BookingRequest) => request<BookingConfirmation>("/api/bookings", { method: "POST", body }),
};
