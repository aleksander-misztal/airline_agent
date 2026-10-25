const numberFormat = new Intl.NumberFormat("pl-PL");

export const formatNumber = (value: number) => numberFormat.format(value);

// Godzina i data są wzięte wprost z ISO, czyli w czasie lokalnym lotniska (bez przeliczania stref).
export const timeOf = (iso: string) => iso.slice(11, 16);
export const dateOf = (iso: string) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(0, 4)}`;
