import { expect, test } from "@playwright/test";
import { logIn, openAssistant, sidebar, thread } from "./helpers";

const icon = (page: import("@playwright/test").Page) => page.getByRole("button", { name: "Otwórz asystenta" });
const popup = (page: import("@playwright/test").Page) => page.getByRole("dialog", { name: "Asystent" });

test("the icon sits in the bottom-right corner and opens the popup chat", async ({ page }) => {
  await logIn(page);

  const box = await icon(page).boundingBox();
  const viewport = page.viewportSize()!;
  expect(box!.x + box!.width).toBeGreaterThan(viewport.width - 60);
  expect(box!.y + box!.height).toBeGreaterThan(viewport.height - 60);

  await icon(page).click();
  await expect(popup(page)).toBeVisible();
  await expect(popup(page).getByRole("textbox", { name: "Wiadomość" })).toBeFocused();
});

test("a popup conversation shows up in the Asystent tab", async ({ page }) => {
  await logIn(page);
  await icon(page).click();

  await popup(page).getByRole("button", { name: "Status lotu" }).click();
  await expect(popup(page).getByText("Planowy")).toBeVisible();
  await popup(page).getByRole("button", { name: "Zamknij asystenta" }).click();
  await expect(popup(page)).toBeHidden();

  await openAssistant(page);
  await expect(icon(page)).toBeHidden();
  await expect(sidebar(page).getByRole("button", { name: "Jaki jest status mojego lotu QR123?", exact: true })).toHaveAttribute(
    "aria-current",
    "true",
  );
  await expect(thread(page).getByText("Planowy")).toBeVisible();
});

test("the icon is also on the flight search, with suggestions for it", async ({ page }) => {
  await logIn(page);
  await page.getByRole("navigation", { name: "Główna nawigacja" }).getByRole("link", { name: "Wyszukaj loty" }).click();

  await icon(page).click();

  await expect(popup(page).getByRole("button", { name: "Klasy podróży" })).toBeVisible();
  await popup(page).getByRole("button", { name: "Zmiana daty" }).click();
  await expect(popup(page).getByText(/Datę lotu możesz zmienić/)).toBeVisible();
});

test("Escape closes the popup", async ({ page }) => {
  await logIn(page);
  await icon(page).click();

  await page.keyboard.press("Escape");

  await expect(popup(page)).toBeHidden();
  await expect(icon(page)).toBeFocused();
});

test("a flight card fits inside the popup window", async ({ page }) => {
  await logIn(page);
  await icon(page).click();

  await popup(page).getByRole("button", { name: "Status lotu" }).click();

  const card = popup(page).getByRole("article");
  await expect(card.getByText("B12")).toBeInViewport({ ratio: 1 });
  const cardBox = (await card.boundingBox())!;
  const popupBox = (await popup(page).boundingBox())!;
  expect(cardBox.x).toBeGreaterThanOrEqual(popupBox.x);
  expect(cardBox.x + cardBox.width).toBeLessThanOrEqual(popupBox.x + popupBox.width);
});
