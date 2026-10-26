import { expect, test, type Page } from "@playwright/test";
import { inDays, logIn } from "./helpers";

async function openSearch(page: Page) {
  await logIn(page);
  await page.getByRole("navigation", { name: "Główna nawigacja" }).getByRole("link", { name: "Wyszukaj loty" }).click();
  await expect(page).toHaveURL(/\/flights$/);
}

async function pickAirport(page: Page, label: string, query: string, option: RegExp) {
  await page.getByRole("combobox", { name: label }).fill(query);
  await page.getByRole("listbox").getByRole("option", { name: option }).click();
}

async function search(page: Page, to: [string, RegExp]) {
  await pickAirport(page, "Skąd", "war", /Warszawa/);
  await pickAirport(page, "Dokąd", ...to);
  await page.getByLabel("Data wylotu").fill(inDays(30));
  await page.getByLabel("Data powrotu").fill(inDays(37));
  await page.getByRole("button", { name: "Szukaj lotów" }).click();
  await expect(page.getByRole("list", { name: "Wyniki wyszukiwania" })).toBeVisible();
}

const history = (page: Page) => page.getByRole("region", { name: "Ostatnie wyszukiwania" });

test("a search can be recalled with one click after the page is reloaded", async ({ page }) => {
  await openSearch(page);
  await search(page, ["doh", /Doha/]);
  await expect(history(page)).toContainText("Warszawa (WAW) → Doha (DOH)");

  await page.reload();
  await expect(page.getByRole("heading", { level: 1, name: "Wyszukaj loty" })).toBeVisible();
  await expect(page.getByRole("list", { name: "Wyniki wyszukiwania" })).toHaveCount(0);
  await history(page).getByRole("button", { name: /^Warszawa \(WAW\) → Doha \(DOH\)/ }).click();

  await expect(page.getByRole("list", { name: "Wyniki wyszukiwania" })).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Dokąd" })).toHaveValue("Doha (DOH)");
  await expect(page.getByLabel("Data wylotu")).toHaveValue(inDays(30));
});

test("keeps the newest searches on top and survives logout", async ({ page }) => {
  await openSearch(page);
  await search(page, ["doh", /Doha/]);
  await page.getByRole("combobox", { name: "Dokąd" }).fill("dub");
  await page.getByRole("listbox").getByRole("option", { name: /Dubaj/ }).click();
  await page.getByRole("button", { name: "Szukaj lotów" }).click();
  await expect(history(page).getByRole("listitem")).toHaveCount(2);
  await expect(history(page).getByRole("listitem").first()).toContainText("Dubaj (DXB)");

  await page.getByRole("button", { name: "Wyloguj" }).click();
  await page.getByLabel("Login").fill("admin");
  await page.getByLabel("Hasło").fill("admin");
  await page.getByRole("button", { name: "Zaloguj się" }).click();
  await page.getByRole("navigation", { name: "Główna nawigacja" }).getByRole("link", { name: "Wyszukaj loty" }).click();

  await expect(history(page).getByRole("listitem")).toHaveCount(2);
});

test("a single search or the whole history can be removed", async ({ page }) => {
  await openSearch(page);
  await search(page, ["doh", /Doha/]);

  await history(page).getByRole("button", { name: "Usuń z historii: Warszawa (WAW) → Doha (DOH)" }).click();

  await expect(history(page)).toHaveCount(0);
  await page.getByRole("button", { name: "Szukaj lotów" }).click();
  await expect(history(page).getByRole("listitem")).toHaveCount(1);
  await history(page).getByRole("button", { name: "Wyczyść historię" }).click();
  await expect(history(page)).toHaveCount(0);
});
