import { expect, test } from "@playwright/test";
import { logIn, logInToAssistant, send, sidebar, thread } from "./helpers";

test("redirects an anonymous visitor to the login page", async ({ page }) => {
  await page.goto("/chat");

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Logowanie" })).toBeVisible();
});

test("rejects wrong credentials", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Login").fill("admin");
  await page.getByLabel("Hasło").fill("zle");
  await page.getByRole("button", { name: "Zaloguj się" }).click();

  await expect(page.getByRole("alert")).toHaveText("Nieprawidłowy login lub hasło");
  await expect(page).toHaveURL(/\/login$/);
});

test("login → conversations → logout", async ({ page }) => {
  await logInToAssistant(page);
  await expect(page.getByText("Administrator", { exact: true })).toBeVisible();

  // pierwsza rozmowa: podpowiedź ze statusem lotu → karta lotu
  await page.getByRole("button", { name: "Status lotu" }).click();
  await expect(thread(page).getByText("QR123", { exact: true })).toBeVisible();
  await expect(thread(page).getByText("Planowy")).toBeVisible();
  await expect(sidebar(page).getByRole("button", { name: "Jaki jest status mojego lotu QR123?", exact: true })).toBeVisible();

  // druga rozmowa
  await sidebar(page).getByRole("button", { name: "Nowa rozmowa" }).click();
  await expect(page.getByText("W czym mogę pomóc?")).toBeVisible();
  await send(page, "Ile bagażu mogę zabrać?");
  await expect(thread(page).getByText(/Bagaż podręczny: do 7 kg/)).toBeVisible();
  await expect(sidebar(page).getByRole("listitem")).toHaveCount(2);

  // powrót do pierwszej
  await sidebar(page).getByRole("button", { name: "Jaki jest status mojego lotu QR123?", exact: true }).click();
  await expect(thread(page).getByText("QR123", { exact: true })).toBeVisible();

  // usunięcie drugiej
  await sidebar(page).getByRole("button", { name: "Usuń rozmowę: Ile bagażu mogę zabrać?" }).click();
  await expect(sidebar(page).getByRole("listitem")).toHaveCount(1);

  // wylogowanie
  await page.getByRole("button", { name: "Wyloguj" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto("/chat");
  await expect(page).toHaveURL(/\/login$/);
});

test("keeps the session after a reload", async ({ page }) => {
  await logIn(page);

  await page.reload();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText("Administrator", { exact: true })).toBeVisible();
});
