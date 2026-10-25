import { expect, type Page } from "@playwright/test";

export async function logIn(page: Page) {
  await page.goto("/");
  await page.getByLabel("Login").fill("admin");
  await page.getByLabel("Hasło").fill("admin");
  await page.getByRole("button", { name: "Zaloguj się" }).click();
  await expect(page).toHaveURL(/\/chat$/);
}

export const sidebar = (page: Page) => page.getByRole("navigation", { name: "Rozmowy" });
export const thread = (page: Page) => page.getByRole("list", { name: "Wiadomości" });

export async function send(page: Page, text: string) {
  await page.getByRole("textbox", { name: "Wiadomość" }).fill(text);
  await page.keyboard.press("Enter");
}
