import { expect, type Page } from "@playwright/test";

export async function logIn(page: Page) {
  await page.goto("/");
  await page.getByLabel("Login").fill("admin");
  await page.getByLabel("Hasło").fill("admin");
  await page.getByRole("button", { name: "Zaloguj się" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

export async function openAssistant(page: Page) {
  await page.getByRole("link", { name: "Asystent", exact: true }).click();
  await expect(page).toHaveURL(/\/chat$/);
}

/** Logowanie i przejście do zakładki Asystent. */
export async function logInToAssistant(page: Page) {
  await logIn(page);
  await openAssistant(page);
}

export const sidebar = (page: Page) => page.getByRole("navigation", { name: "Rozmowy" });
export const thread = (page: Page) => page.getByRole("list", { name: "Wiadomości" });

export async function send(page: Page, text: string) {
  await page.getByRole("textbox", { name: "Wiadomość" }).fill(text);
  await page.keyboard.press("Enter");
}

/** Dzień w formacie YYYY-MM-DD, `days` dni od dziś. */
export const inDays = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);
