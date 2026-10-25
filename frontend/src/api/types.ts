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
