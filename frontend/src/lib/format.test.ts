import { dateOf, formatNumber, timeOf } from "./format";

describe("format helpers", () => {
  it("groups thousands in Polish style", () => {
    expect(formatNumber(48250).replace(/\s/g, " ")).toBe("48 250");
    expect(formatNumber(37)).toBe("37");
  });

  it("takes the airport-local time from an ISO string without timezone conversion", () => {
    expect(timeOf("2026-11-02T14:35:00+01:00")).toBe("14:35");
    expect(timeOf("2026-11-02T22:50:00+03:00")).toBe("22:50");
  });

  it("formats the date as dd.mm.yyyy", () => {
    expect(dateOf("2026-11-02T14:35:00+01:00")).toBe("02.11.2026");
  });
});
