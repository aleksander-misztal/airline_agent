import { dateOf, formatDuration, formatNumber, formatPrice, offersLabel, stopsLabel, timeOf } from "./format";

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

describe("flight formatting", () => {
  it.each([
    [375, "6 h 15 min"],
    [120, "2 h"],
    [45, "45 min"],
    [60, "1 h"],
    [0, "0 min"],
  ])("formatDuration(%i) → %s", (value, expected) => {
    expect(formatDuration(value)).toBe(expected);
  });

  it.each([
    [0, "Bezpośredni"],
    [1, "1 przesiadka"],
    [2, "2 przesiadki"],
    [5, "5 przesiadek"],
  ])("stopsLabel(%i) → %s", (stops, expected) => {
    expect(stopsLabel(stops)).toBe(expected);
  });

  it.each([
    [1, "1 oferta"],
    [2, "2 oferty"],
    [4, "4 oferty"],
    [5, "5 ofert"],
    [12, "12 ofert"],
    [22, "22 oferty"],
  ])("offersLabel(%i) → %s", (count, expected) => {
    expect(offersLabel(count)).toBe(expected);
  });

  it("formats prices in złoty without decimals, with grouped thousands", () => {
    expect(formatPrice(2450, "PLN").replace(/\s/g, " ")).toBe("2450 zł");
    expect(formatPrice(12450, "PLN").replace(/\s/g, " ")).toBe("12 450 zł");
  });

  it("formats other currencies with their own symbol", () => {
    expect(formatPrice(100, "EUR")).toContain("€");
  });
});
