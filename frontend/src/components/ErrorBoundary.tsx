import { Component, type ErrorInfo, type ReactNode } from "react";

type ErrorBoundaryState = { failed: boolean };

// Ostatnia siatka bezpieczeństwa: błąd renderowania nie zostawia białej strony.
export class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Nieobsłużony błąd aplikacji", error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;

    return (
      <div role="alert" className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 className="text-3xl font-light text-brand">Coś poszło nie tak</h1>
        <p className="max-w-md text-brand-gray">Wystąpił nieoczekiwany błąd. Odśwież stronę i spróbuj ponownie.</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="cursor-pointer rounded-full bg-brand px-6 py-3 font-medium text-white transition-colors hover:bg-brand-dark"
        >
          Odśwież stronę
        </button>
      </div>
    );
  }
}
