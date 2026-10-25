import { expect, test } from "@playwright/test";
import { logIn, openAssistant } from "./helpers";

test("dashboard shows the tiles and the Avios balance in the header", async ({ page }) => {
  await logIn(page);

  await expect(page.getByRole("heading", { level: 1, name: /Dzień dobry/ })).toBeVisible();
  await expect(page.getByRole("region", { name: "Avios" })).toContainText(/48\s250/);
  await expect(page.getByRole("region", { name: "Przebyte mile" })).toContainText(/126\s840/);
  await expect(page.getByRole("region", { name: "Odbyte loty" })).toContainText("37");
  await expect(page.getByRole("region", { name: "Nadchodzące rezerwacje" }).getByRole("listitem")).toHaveCount(2);
  await expect(page.getByRole("banner")).toContainText(/48\s250 Avios/);
});

test("the flight search tile opens the search tab", async ({ page }) => {
  await logIn(page);

  await page.getByRole("region", { name: "Wyszukiwarka lotów" }).getByRole("link", { name: "Wyszukaj loty" }).click();

  await expect(page).toHaveURL(/\/flights$/);
  await expect(page.getByRole("heading", { level: 1, name: "Wyszukaj loty" })).toBeVisible();
});

test("tabs switch between the dashboard and the assistant, Avios stays in the header", async ({ page }) => {
  await logIn(page);

  await openAssistant(page);
  await expect(page.getByRole("banner")).toContainText(/48\s250 Avios/);
  await expect(page.getByRole("link", { name: "Asystent", exact: true })).toHaveAttribute("aria-current", "page");

  await page.getByRole("link", { name: "Dashboard", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
});
