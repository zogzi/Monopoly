import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "tests/browser",
  workers: 1,
  timeout: 150000,
  use: {
    baseURL: "http://127.0.0.1:3019",
    headless: true,
    launchOptions: {
      executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
      args: [
        "--no-sandbox",
        "--enable-unsafe-swiftshader",
        "--use-gl=angle",
        "--use-angle=swiftshader",
      ],
    },
    viewport: { width: 1440, height: 960 },
  },
  webServer: {
    command: "npm run build && npm start",
    url: "http://127.0.0.1:3019/api/health",
    env: { PORT: "3019", SAVE_DIR: `/tmp/empire-browser-test-${Date.now()}` },
    reuseExistingServer: false,
  },
  reporter: "list",
});
