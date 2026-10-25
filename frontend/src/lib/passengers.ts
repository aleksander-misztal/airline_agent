import type { Passengers } from "../features/flights/types";
import { plural } from "./format";

export function describePassengers({ adults, children, infants }: Passengers): string {
  const parts = [`${adults} ${adults === 1 ? "dorosły" : "dorosłych"}`];
  if (children > 0) parts.push(`${children} ${plural(children, "dziecko", "dzieci", "dzieci")}`);
  if (infants > 0) parts.push(`${infants} ${plural(infants, "niemowlę", "niemowlęta", "niemowląt")}`);
  return parts.join(", ");
}
