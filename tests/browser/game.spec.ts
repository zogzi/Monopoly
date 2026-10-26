import { io } from "socket.io-client";
import { test, expect } from "@playwright/test";
test("join, select token, four-player lobby, 3D, chat, refresh and mobile controls", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Take your seat." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "cat", exact: true }).click();
  await page.getByPlaceholder("Enter your name").fill("Alex");
  await page.getByRole("button", { name: "Enter Nova City" }).click();
  await expect(
    page.getByRole("heading", { name: "Welcome, Alex." }),
  ).toBeVisible();
  await expect(page.locator("canvas")).toBeVisible();
  await page.getByRole("button", { name: "I’m ready" }).click();
  const peers = [];
  for (const name of ["Ben", "Eva", "Mark"]) {
    const peer = io("http://127.0.0.1:3019", { transports: ["websocket"] });
    peers.push(peer);
    await new Promise<void>((resolve) => peer.on("connect", () => resolve()));
    await new Promise<void>((resolve) =>
      peer.emit("JOIN_GAME", { name, figure: "robot" }, () => resolve()),
    );
    await new Promise<void>((resolve) =>
      peer.emit("COMMAND", { type: "READY" }, () => resolve()),
    );
  }

  await expect(
    page.getByRole("button", { name: "Start the circuit" }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Start the circuit" }).click();
  await expect(
    page.getByRole("heading", { name: "Plan. Build. Grow." }),
  ).toBeVisible();
  await page
    .getByRole("textbox", { name: "Table chat message" })
    .fill("Let’s build an empire!");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(
    page.getByText("Let’s build an empire!", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "City on pause." }),
  ).toBeVisible();
  await expect(page.getByText("Alex (you)", { exact: true })).toBeVisible();
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
  expect(errors).toEqual([]);
  for (const peer of peers) peer.disconnect();
});
