import type { Passengers } from "../features/flights/types";

// Polska odmiana: 1 → forma pojedyncza, 2–4 (poza 12–14) → "few", reszta → "many".
function plural(n: number, one: string, few: string, many: string) {
  if (n === 1) return one;
  const lastTwo = n % 100;
  if (n % 10 >= 2 && n % 10 <= 4 && !(lastTwo >= 12 && lastTwo <= 14)) return few;
  return many;
}

export function describePassengers({ adults, children, infants }: Passengers): string {
  const parts = [`${adults} ${adults === 1 ? "dorosły" : "dorosłych"}`];
  if (children > 0) parts.push(`${children} ${plural(children, "dziecko", "dzieci", "dzieci")}`);
  if (infants > 0) parts.push(`${infants} ${plural(infants, "niemowlę", "niemowlęta", "niemowląt")}`);
  return parts.join(", ");
}
