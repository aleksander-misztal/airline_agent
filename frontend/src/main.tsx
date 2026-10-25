import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import App from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import "./index.css";

async function enableMocking() {
  if (!import.meta.env.DEV || import.meta.env.VITE_USE_MOCKS === "false") return;
  const { worker } = await import("./api/mocks/browser");
  await worker.start({ onUnhandledRequest: "bypass" });
}

enableMocking().then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <ErrorBoundary>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ErrorBoundary>
    </StrictMode>,
  );
});
