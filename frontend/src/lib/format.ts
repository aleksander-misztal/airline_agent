const numberFormat = new Intl.NumberFormat("pl-PL");

export const formatNumber = (value: number) => numberFormat.format(value);

// Godzina i data są wzięte wprost z ISO, czyli w czasie lokalnym lotniska (bez przeliczania stref).
export const timeOf = (iso: string) => iso.slice(11, 16);
export const dateOf = (iso: string) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(0, 4)}`;

/** Polska odmiana: 1 → forma pojedyncza, 2–4 (poza 12–14) → "few", reszta → "many". */
export function plural(n: number, one: string, few: string, many: string) {
  if (n === 1) return one;
  const lastTwo = n % 100;
  if (n % 10 >= 2 && n % 10 <= 4 && !(lastTwo >= 12 && lastTwo <= 14)) return few;
  return many;
}

export function formatDuration(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} min`;
  return minutes === 0 ? `${hours} h` : `${hours} h ${minutes} min`;
}

export const stopsLabel = (stops: number) =>
  stops === 0 ? "Bezpośredni" : `${stops} ${plural(stops, "przesiadka", "przesiadki", "przesiadek")}`;

export const offersLabel = (count: number) => `${count} ${plural(count, "oferta", "oferty", "ofert")}`;

export const formatPrice = (amount: number, currency: string) =>
  new Intl.NumberFormat("pl-PL", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
