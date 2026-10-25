import "@testing-library/jest-dom/vitest";
import { server } from "../api/mocks/server";
import { resetDb } from "../api/mocks/db";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  resetDb();
});
afterAll(() => server.close());
