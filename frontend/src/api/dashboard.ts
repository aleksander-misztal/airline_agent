import { request } from "./client";
import type { DashboardSummary } from "./types";

export const dashboardApi = {
  getSummary: () => request<DashboardSummary>("/api/dashboard"),
};
