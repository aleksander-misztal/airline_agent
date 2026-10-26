import "@testing-library/jest-dom/vitest";
import { server } from "../api/mocks/server";
import { resetDb } from "../api/mocks/db";
import { useAuthStore } from "../features/auth/authStore";
import { useChatStore } from "../features/chat/chatStore";
import { useDashboardStore } from "../features/dashboard/dashboardStore";
import { useFlightSearchStore } from "../features/flights/flightSearchStore";
import { useRecentSearchesStore } from "../features/flights/recentSearchesStore";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  resetDb();
  useAuthStore.setState(useAuthStore.getInitialState(), true);
  useChatStore.setState(useChatStore.getInitialState(), true);
  useDashboardStore.setState(useDashboardStore.getInitialState(), true);
  useFlightSearchStore.setState(useFlightSearchStore.getInitialState(), true);
  useRecentSearchesStore.setState(useRecentSearchesStore.getInitialState(), true);
  localStorage.clear();
});
afterAll(() => server.close());
