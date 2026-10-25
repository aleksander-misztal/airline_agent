import "@testing-library/jest-dom/vitest";
import { server } from "../api/mocks/server";
import { resetDb } from "../api/mocks/db";
import { useAuthStore } from "../features/auth/authStore";
import { useChatStore } from "../features/chat/chatStore";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  resetDb();
  useAuthStore.setState(useAuthStore.getInitialState(), true);
  useChatStore.setState(useChatStore.getInitialState(), true);
});
afterAll(() => server.close());
