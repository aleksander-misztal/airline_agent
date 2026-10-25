import "@testing-library/jest-dom/vitest";
import { server } from "../api/mocks/server";
import { resetDb } from "../api/mocks/db";
import { useAuthStore } from "../features/auth/authStore";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  resetDb();
  useAuthStore.setState(useAuthStore.getInitialState(), true);
});
afterAll(() => server.close());
