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

async function fillAndSearch(page: Page) {
  await pickAirport(page, "Skąd", "war", /Warszawa/);
  await pickAirport(page, "Dokąd", "doh", /Doha/);
  await page.getByLabel("Data wylotu").fill(inDays(30));
  await page.getByLabel("Data powrotu").fill(inDays(37));
  await page.getByRole("button", { name: "Szukaj lotów" }).click();
  await expect(page.getByRole("list", { name: "Wyniki wyszukiwania" })).toBeVisible();
}

async function searchFlights(page: Page) {
  await openSearch(page);
  await fillAndSearch(page);
}

const form = (page: Page) => page.getByRole("button", { name: "Szukaj lotów" }).locator("xpath=ancestor::form");
const panel = (page: Page) => page.getByRole("region", { name: "Lista lotów" });
const offers = (page: Page) => page.getByRole("list", { name: "Wyniki wyszukiwania" }).locator("> li");

test("the search window moves left and a symmetric results window appears on the right", async ({ page }) => {
  await openSearch(page);
  const before = (await form(page).boundingBox())!;
  const viewport = page.viewportSize()!;
  expect(Math.abs(before.x + before.width / 2 - viewport.width / 2)).toBeLessThan(40); // na środku

  await fillAndSearch(page);

  const left = (await form(page).boundingBox())!;
  const right = (await panel(page).boundingBox())!;
  expect(left.x + left.width).toBeLessThanOrEqual(right.x);
  expect(Math.abs(left.width - right.width)).toBeLessThanOrEqual(4);
  expect(Math.abs(left.y - right.y)).toBeLessThanOrEqual(4);
  expect(left.x).toBeLessThan(before.x);
});

test("an offer unfolds in place with a vertical timeline, aircraft, layover, price and reserve button", async ({ page }) => {
  await searchFlights(page);
  const connecting = offers(page).filter({ hasText: "1 przesiadka" }).first();

  await connecting.getByRole("button", { expanded: false }).click();

  await expect(page).toHaveURL(/\/flights$/);
  const details = connecting.getByRole("region", { name: "Szczegóły lotu" });
  await expect(details).toBeVisible();
  await expect(details.getByText(/Przesiadka \d+ h|Przesiadka \d+ min/).first()).toBeVisible();
  await expect(details.getByText(/Airbus|Boeing/).first()).toBeVisible();
  await expect(details.getByText(/^Czas podróży:/).first()).toBeVisible();
  await expect(details.getByRole("group", { name: "Cena i rezerwacja" }).getByText(/zł/)).toBeVisible();
  await expect(details.getByRole("button", { name: "Rezerwuj" })).toBeVisible();

  const steps = details.getByRole("list", { name: "Przebieg lotu" }).first().locator("> li");
  const boxes = [];
  for (let i = 0; i < (await steps.count()); i += 1) boxes.push((await steps.nth(i).boundingBox())!);
  expect(boxes.length).toBeGreaterThanOrEqual(5);
  for (let i = 1; i < boxes.length; i += 1) expect(boxes[i].y).toBeGreaterThan(boxes[i - 1].y); // oś pionowa
});

test("only one offer is open at a time", async ({ page }) => {
  await searchFlights(page);

  await offers(page).nth(0).getByRole("button", { expanded: false }).click();
  await offers(page).nth(1).getByRole("button", { expanded: false }).click();

  await expect(page.getByRole("region", { name: "Szczegóły lotu" })).toHaveCount(1);
  await expect(offers(page).nth(0).getByRole("region", { name: "Szczegóły lotu" })).toHaveCount(0);
});

test("reserving confirms the booking and shows it on the dashboard", async ({ page }) => {
  await searchFlights(page);
  const first = offers(page).first();
  await first.getByRole("button", { expanded: false }).click();

  await first.getByRole("button", { name: "Rezerwuj" }).click();

  const confirmation = first.getByRole("status");
  await expect(confirmation).toContainText("Rezerwacja potwierdzona");
  const reference = (await confirmation.textContent())!.match(/Kod rezerwacji: ([A-Z0-9]{6})/)![1];

  await page.getByRole("navigation", { name: "Główna nawigacja" }).getByRole("link", { name: "Dashboard" }).click();
  await expect(page.getByRole("region", { name: "Nadchodzące rezerwacje" }).getByText(reference).first()).toBeVisible();
});

test("sorting and the direct-only filter change the list", async ({ page }) => {
  await searchFlights(page);
  const total = await offers(page).count();

  await page.getByLabel("Sortuj").selectOption("duration");
  await page.getByRole("checkbox", { name: "Tylko bezpośrednie" }).check();

  const direct = await offers(page).count();
  expect(direct).toBeGreaterThan(0);
  expect(direct).toBeLessThan(total);
  await expect(offers(page).filter({ hasText: "przesiadk" })).toHaveCount(0);
});
