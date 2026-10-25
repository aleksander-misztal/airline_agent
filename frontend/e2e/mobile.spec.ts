import { expect, test, type Page } from "@playwright/test";
import { logIn, logInToAssistant, send, sidebar, thread } from "./helpers";

const hasHorizontalScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);

test("login page fits the screen width", async ({ page }) => {
  await page.goto("/login");

  await expect(page.getByRole("heading", { name: "Logowanie" })).toBeVisible();
  expect(await hasHorizontalScroll(page)).toBe(false);
});

test("chat fits the screen and keeps the input reachable", async ({ page }) => {
  await logInToAssistant(page);

  await expect(page.getByRole("textbox", { name: "Wiadomość" })).toBeInViewport();
  expect(await hasHorizontalScroll(page)).toBe(false);
});

test("a flight card fits the screen width", async ({ page }) => {
  await logInToAssistant(page);

  await page.getByRole("button", { name: "Status lotu" }).click();

  await expect(thread(page).getByText("QR123", { exact: true })).toBeVisible();
  expect(await hasHorizontalScroll(page)).toBe(false);
});

test("conversations live in a drawer", async ({ page }) => {
  await logInToAssistant(page);
  await send(page, "Ile bagażu mogę zabrać?");
  await expect(thread(page).getByText(/Bagaż podręczny: do 7 kg/)).toBeVisible();
  await expect(sidebar(page)).toBeHidden();

  await page.getByRole("button", { name: "Rozmowy" }).click();
  await expect(sidebar(page)).toBeVisible();

  await sidebar(page).getByRole("button", { name: "Ile bagażu mogę zabrać?", exact: true }).click();
  await expect(sidebar(page)).toBeHidden();
  await expect(thread(page).getByText(/Bagaż podręczny: do 7 kg/)).toBeVisible();
});

test("dashboard tiles and header tabs fit the screen width", async ({ page }) => {
  await logIn(page);

  await expect(page.getByRole("region", { name: "Avios" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Asystent", exact: true })).toBeInViewport();
  expect(await hasHorizontalScroll(page)).toBe(false);
});

test("flight search form fits the screen width", async ({ page }) => {
  await logIn(page);
  await page.getByRole("navigation", { name: "Główna nawigacja" }).getByRole("link", { name: "Wyszukaj loty" }).click();

  await expect(page.getByRole("button", { name: "Szukaj lotów" })).toBeVisible();
  await page.getByRole("combobox", { name: "Skąd" }).click();
  await expect(page.getByRole("listbox")).toBeInViewport();
  expect(await hasHorizontalScroll(page)).toBe(false);
});
