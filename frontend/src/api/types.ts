// Kontrakt API – wspólny dla backend_py i backend_ts.

export type User = {
  id: string;
  username: string;
  displayName: string;
};

export type Conversation = {
  id: string;
  title: string;
  createdAt: string;
};

export type TextPayload = { text: string };

export type FlightCardPayload = {
  flightNumber: string;
  from: string;
  to: string;
  departure: string;
  arrival: string;
  status: string;
  gate: string;
};

type MessageBase = {
  id: string;
  conversationId: string;
  role: "user" | "assistant";
  createdAt: string;
};

// Nowy rodzaj treści = nowy wariant tutaj + komponent w rejestrze rendererów.
export type Message = MessageBase &
  (
    | { type: "text"; payload: TextPayload }
    | { type: "flight_card"; payload: FlightCardPayload }
  );

export type SendMessageResult = {
  userMessage: Message;
  reply: Message;
};

export type Booking = {
  reference: string;
  flightNumber: string;
  from: string;
  to: string;
  departure: string;
  arrival: string;
  cabin: string;
};

export type DashboardSummary = {
  /** Saldo punktów milowych. */
  avios: number;
  milesFlown: number;
  flightsTaken: number;
  /** Od najbliższego odlotu. */
  upcomingBookings: Booking[];
};

export type Airport = {
  /** Kod IATA. */
  code: string;
  city: string;
  country: string;
  name: string;
};

export type Cabin = "economy" | "business" | "first";

export type FlightSearchParams = {
  /** Kod IATA lotniska wylotu. */
  from: string;
  /** Kod IATA lotniska przylotu. */
  to: string;
  /** YYYY-MM-DD */
  departureDate: string;
  /** YYYY-MM-DD; null = w jedną stronę */
  returnDate: string | null;
  adults: number;
  children: number;
  infants: number;
  cabin: Cabin;
};

export type FlightSegment = {
  flightNumber: string;
  aircraft: string;
  from: Airport;
  to: Airport;
  /** ISO z offsetem lotniska wylotu. */
  departure: string;
  /** ISO z offsetem lotniska przylotu. */
  arrival: string;
  durationMinutes: number;
};

/** Jeden kierunek podróży; kilka segmentów = przesiadki. */
export type Itinerary = {
  segments: FlightSegment[];
  /** Od odlotu pierwszego do przylotu ostatniego segmentu, razem z przesiadkami. */
  durationMinutes: number;
};

export type FlightOffer = {
  id: string;
  /** Cena biletu za całą grupę pasażerów. */
  price: { amount: number; currency: string };
  /** 1 element = w jedną stronę, 2 = tam i powrót. */
  legs: Itinerary[];
};

export type FlightSearchResult = { offers: FlightOffer[] };

export type BookingRequest = { offerId: string; search: FlightSearchParams };

export type BookingConfirmation = {
  reference: string;
  /** Po jednej rezerwacji na każdy kierunek. */
  bookings: Booking[];
};
