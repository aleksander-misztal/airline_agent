import { create } from "zustand";
import { dashboardApi, type DashboardSummary } from "../../api";

type DashboardStatus = "idle" | "loading" | "ready" | "error";

type DashboardState = {
  status: DashboardStatus;
  summary: DashboardSummary | null;
  error: string | null;
  load: () => Promise<void>;
  reset: () => void;
};

export const useDashboardStore = create<DashboardState>()((set, get) => ({
  status: "idle",
  summary: null,
  error: null,

  async load() {
    if (get().status === "loading") return;
    set({ status: "loading", error: null });
    try {
      set({ summary: await dashboardApi.getSummary(), status: "ready" });
    } catch {
      set({ summary: null, status: "error", error: "Nie udało się wczytać danych." });
    }
  },

  reset() {
    set({ status: "idle", summary: null, error: null });
  },
}));
