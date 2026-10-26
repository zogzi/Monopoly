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
  const readable = await page
    .locator(".token-picker small")
    .first()
    .evaluate((e) => Number.parseFloat(getComputedStyle(e).fontSize));
  expect(readable).toBeGreaterThanOrEqual(12);
  await page.getByRole("button", { name: "How to play", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.screenshot({ path: "artifacts/characters.png", fullPage: true });
  await page.getByPlaceholder("Enter your name").fill("Alex");
  await page.getByRole("button", { name: "Join game" }).click();
  await expect(
    page.getByRole("heading", { name: "Welcome, Alex." }),
  ).toBeVisible();
  await expect(page.locator("canvas")).toBeVisible();
  for (let i = 0; i < 3; i++)
    await page.getByRole("button", { name: "Add a bot", exact: true }).click();
  await expect(page.locator(".bot-list>div")).toHaveCount(3);
  await page.getByLabel("Play my turns automatically").click();
  await expect(page.getByLabel("Play my turns automatically")).toBeChecked();
  await page.getByRole("combobox", { name: "Bot speed" }).selectOption("FAST");
  await page.getByRole("button", { name: "I’m ready" }).click();
  await page.getByRole("button", { name: "Start game" }).click();
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
    page.getByRole("heading", { name: "Game paused" }),
  ).toBeVisible();
  await expect(page.getByText("Alex (you)", { exact: true })).toBeVisible();
  await page.locator(".player").first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Close", exact: true })
    .click();
  await expect(page.locator("canvas")).toHaveAttribute(
    "data-draw-calls",
    /\d+/,
  );
  const calls = Number(
    await page.locator("canvas").getAttribute("data-draw-calls"),
  );
  expect(calls).toBeGreaterThan(0);
  expect(calls).toBeLessThan(55);
  console.log("Four-player Halloween scene draw calls:", calls);
  await page.getByRole("button", { name: "Properties", exact: true }).click();
  await page.locator("summary").filter({ hasText: "Harbor Row" }).click();
  await page.getByRole("button", { name: /Dockside Works/ }).click();
  await expect(
    page.getByRole("heading", { name: "Dockside Works" }),
  ).toBeVisible();
  await page.screenshot({ path: "artifacts/desktop.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Show city" }).click();
  await expect(page.locator("canvas")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: "artifacts/mobile.png", fullPage: true });
  await page.getByRole("button", { name: "Show controls" }).click();
  await expect(
    page.getByRole("heading", { name: "Dockside Works" }),
  ).toBeVisible();
  await page.screenshot({
    path: "artifacts/mobile-controls.png",
    fullPage: true,
  });

  await page.setViewportSize({ width: 1440, height: 960 });
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect(page.getByRole("heading", { name: /wins\./ })).toBeVisible({
    timeout: 80000,
  });
  await page.getByRole("button", { name: "Play again" }).click();
  await expect(
    page.getByRole("heading", { name: "Welcome, Alex." }),
  ).toBeVisible();
  await expect(page.locator(".bot-list>div")).toHaveCount(3);
  for (let i = 0; i < 11; i++)
    await page.getByRole("button", { name: "Add a bot", exact: true }).click();
  await expect(page.locator(".bot-list>div")).toHaveCount(14);
  await expect(
    page.getByRole("button", { name: "Add a bot", exact: true }),
  ).toBeDisabled();
  await expect(page.locator("canvas")).toHaveAttribute(
    "data-player-count",
    "15",
  );
  const maxCalls = Number(
    await page.locator("canvas").getAttribute("data-draw-calls"),
  );
  expect(maxCalls).toBeGreaterThan(0);
  expect(maxCalls).toBeLessThan(100);
  console.log("Fifteen-player Halloween scene draw calls:", maxCalls);
  await page.screenshot({
    path: "artifacts/fifteen-players.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
});
test("phone controls keep every tab readable and visible without horizontal scrolling", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto("/");
  for (const label of [
    "Play",
    "My properties",
    "Properties",
    "Game log",
    "Players",
  ])
    await expect(
      page.getByRole("button", { name: label, exact: true }),
    ).toBeVisible();
  await page.getByRole("button", { name: "Players", exact: true }).click();
  await expect(
    page
      .locator(".left-panel")
      .getByRole("heading", { name: "Players", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const text = await page
    .locator("nav button")
    .evaluateAll((nodes) =>
      nodes.map((node) => Number.parseFloat(getComputedStyle(node).fontSize)),
    );
  expect(text.every((size) => size >= 14)).toBe(true);
  await page.getByRole("button", { name: "Show city" }).click();
  const control = page.getByRole("button", { name: "Show controls" });
  await expect(control).toBeVisible();
  await control.hover();
  const colors = await control.evaluate((e) => ({
    text: getComputedStyle(e).color,
    background: getComputedStyle(e).backgroundColor,
  }));
  expect(colors.background).toBe("rgb(75, 52, 95)");
  await control.click();
  await expect(page.locator(".left-panel")).toBeVisible();
  await page.getByRole("button", { name: "Properties", exact: true }).click();
  await page.locator("summary").filter({ hasText: "Harbor Row" }).click();
  await page.getByRole("button", { name: /Dockside Works/ }).click();
  await expect(
    page.getByRole("heading", { name: "Dockside Works" }),
  ).toBeVisible();
  for (const label of ["Owner", "Purchase price", "Rent per visit"]) {
    const bounds = await page
      .locator(".left-panel")
      .getByText(label, { exact: true })
      .boundingBox();
    expect(bounds).toBeTruthy();
    const unobstructed = await page.evaluate(
      ({ x, y }) => !!document.elementFromPoint(x, y)?.closest(".left-panel"),
      { x: bounds!.x + bounds!.width / 2, y: bounds!.y + bounds!.height / 2 },
    );
    expect(unobstructed).toBe(true);
  }
  await page.screenshot({
    path: "artifacts/mobile-controls.png",
    fullPage: true,
  });
});
