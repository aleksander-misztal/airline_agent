import { formatNumber } from "../lib/format";

/** Liczba w formie, jaką widzi Testing Library: twarde spacje zamienione na zwykłe. */
export const plainNumber = (value: number) => formatNumber(value).replace(/\s/g, " ");
