import { fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { formatNumber, formatPrice } from "../lib/format";

/** Liczba w formie, jaką widzi Testing Library: twarde spacje zamienione na zwykłe. */
export const plainNumber = (value: number) => formatNumber(value).replace(/\s/g, " ");

export const plainPrice = (amount: number, currency = "PLN") => formatPrice(amount, currency).replace(/\s/g, " ");

/** Data (YYYY-MM-DD) `days` dni od dziś. */
export const inDays = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);

async function pickAirport(label: string, query: string, option: RegExp) {
  const box = screen.getByRole("combobox", { name: label });
  await userEvent.click(box);
  await userEvent.type(box, query);
  await userEvent.click(await within(await screen.findByRole("listbox")).findByRole("option", { name: option }));
}

type FormValues = { from?: [string, RegExp]; to?: [string, RegExp]; depart?: string; back?: string | null };

/** Wypełnia formularz wyszukiwania lotów (domyślnie Warszawa → Doha w obie strony) i klika „Szukaj lotów”. */
export async function searchFlights({
  from = ["war", /Warszawa/],
  to = ["doh", /Doha/],
  depart = inDays(30),
  back = inDays(37),
}: FormValues = {}) {
  await pickAirport("Skąd", ...from);
  await pickAirport("Dokąd", ...to);
  fireEvent.change(screen.getByLabelText("Data wylotu"), { target: { value: depart } });
  if (back) fireEvent.change(screen.getByLabelText("Data powrotu"), { target: { value: back } });
  await userEvent.click(screen.getByRole("button", { name: "Szukaj lotów" }));
}
