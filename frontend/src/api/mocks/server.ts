import { setupServer } from "msw/node";
import { handlers } from "./handlers";

// Używane w testach (Node).
export const server = setupServer(...handlers);
