import { expect, test, type Page } from "@playwright/test";
import { inDays, logIn } from "./helpers";

async function pickAirport(page: Page, label: string, query: string, option: RegExp) {
  await page.getByRole("combobox", { name: label }).fill(query);
  await page.getByRole("option", { name: option }).click();
}

test.beforeEach(async ({ page }) => {
  await logIn(page);
  await page.getByRole("navigation", { name: "Główna nawigacja" }).getByRole("link", { name: "Wyszukaj loty" }).click();
  await expect(page).toHaveURL(/\/flights$/);
});

test("shows what is missing when the form is empty", async ({ page }) => {
  await page.getByRole("button", { name: "Szukaj lotów" }).click();

  await expect(page.getByText("Wybierz lotnisko wylotu")).toBeVisible();
  await expect(page.getByText("Podaj datę wylotu")).toBeVisible();
  await expect(page.getByRole("region", { name: "Kryteria wyszukiwania" })).toBeHidden();
});

test("searches a round trip with suggestions, passengers and cabin", async ({ page }) => {
  await pickAirport(page, "Skąd", "krak", /Kraków/);
  await pickAirport(page, "Dokąd", "doh", /Doha/);
  await page.getByLabel("Data wylotu").fill(inDays(30));
  await page.getByLabel("Data powrotu").fill(inDays(40));
  await page.getByRole("button", { name: "Więcej: Dorośli" }).click();
  await page.getByRole("button", { name: "Więcej: Dzieci" }).click();
  await page.getByLabel("Klasa podróży").selectOption("business");

  await page.getByRole("button", { name: "Szukaj lotów" }).click();

  const summary = page.getByRole("region", { name: "Kryteria wyszukiwania" });
  await expect(summary).toContainText("Kraków (KRK) → Doha (DOH)");
  await expect(summary).toContainText("2 dorosłych, 1 dziecko");
  await expect(summary).toContainText("Business");
});

test("one-way trip has no return date", async ({ page }) => {
  await page.getByText("W jedną stronę", { exact: true }).click();

  await expect(page.getByRole("radio", { name: "W jedną stronę" })).toBeChecked();
  await expect(page.getByLabel("Data powrotu")).toHaveCount(0);
});

test("swaps the airports", async ({ page }) => {
  await pickAirport(page, "Skąd", "war", /Warszawa/);
  await pickAirport(page, "Dokąd", "doh", /Doha/);

  await page.getByRole("button", { name: "Zamień lotniska" }).click();

  await expect(page.getByRole("combobox", { name: "Skąd" })).toHaveValue("Doha (DOH)");
  await expect(page.getByRole("combobox", { name: "Dokąd" })).toHaveValue("Warszawa (WAW)");
});
