import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

// Używane w przeglądarce (npm run dev), dopóki nie ma prawdziwego backendu.
export const worker = setupWorker(...handlers);
