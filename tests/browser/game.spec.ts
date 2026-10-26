import { test, expect } from "@playwright/test";
test("ten original people, solo bots, new theme, no chat, simulation, reconnect and mobile map", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Take your seat." }),
  ).toBeVisible();
  for (const name of [
    "Moxie Vale",
    "Otto Brass",
    "Vesper Moon",
    "Bruno Bloom",
    "Zuri Volt",
    "Cleo Frost",
    "Dex Dune",
    "Lola Lux",
    "Sage Sterling",
    "Niko Nova",
  ])
    await expect(page.getByRole("button", { name, exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Vesper Moon", exact: true }).click();
  await page.screenshot({ path: "artifacts/characters.png", fullPage: true });
  await page.getByPlaceholder("Enter your name").fill("Alex");
  await page.getByRole("button", { name: "Enter Nova City" }).click();
  await expect(
    page.getByRole("heading", { name: "Welcome, Alex." }),
  ).toBeVisible();
  await expect(page.locator("canvas")).toBeVisible();
  for (let i = 0; i < 3; i++)
    await page.getByRole("button", { name: "+ Add bot", exact: true }).click();
  await expect(page.locator(".bot-list>div")).toHaveCount(3);
  await page.getByLabel("Autoplay my seat").click();
  await expect(page.getByLabel("Autoplay my seat")).toBeChecked();
  await page.getByRole("combobox", { name: "Bot pace" }).selectOption("FAST");
  await page.getByRole("button", { name: "I’m ready" }).click();
  await page.getByRole("button", { name: "Start the circuit" }).click();
  await expect(
    page.getByRole("textbox", { name: "Table chat message" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Talk", exact: true }),
  ).toHaveCount(0);
  await expect(page.locator(".event-ticker")).toContainText(
    /rolled|acquired|Round|paid|passed|received/,
  );
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "City on pause." }),
  ).toBeVisible();
  await expect(page.getByText("Alex (you)", { exact: true })).toBeVisible();
  await page.locator(".player").first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "×", exact: true })
    .click();
  await expect(page.locator("canvas")).toHaveAttribute(
    "data-draw-calls",
    /\d+/,
  );
  const calls = Number(
    await page.locator("canvas").getAttribute("data-draw-calls"),
  );
  expect(calls).toBeGreaterThan(0);
  expect(calls).toBeLessThan(200);
  console.log("Four-player Halloween scene draw calls:", calls);
  await page.getByRole("button", { name: "City guide", exact: true }).click();
  await page.locator("summary").filter({ hasText: "Harbor Row" }).click();
  await page.getByRole("button", { name: /Dockside Works/ }).click();
  await expect(
    page.getByRole("heading", { name: "Dockside Works" }),
  ).toBeVisible();
  await page.screenshot({ path: "artifacts/desktop.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Explore city" }).click();
  await expect(page.locator("canvas")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: "artifacts/mobile.png", fullPage: true });
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  await page.getByRole("button", { name: "Overview", exact: true }).click();
  await expect(page.getByRole("heading", { name: /wins\./ })).toBeVisible({
    timeout: 80000,
  });
  await page.getByRole("button", { name: "Rematch" }).click();
  await expect(
    page.getByRole("heading", { name: "Welcome, Alex." }),
  ).toBeVisible();
  await expect(page.locator(".bot-list>div")).toHaveCount(3);
  expect(errors).toEqual([]);
});
