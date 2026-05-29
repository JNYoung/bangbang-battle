import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

import { chromium, webkit } from "playwright";

const DEFAULT_BASE_URL = "http://localhost:4180/";
const LEGAL_VERSION = "2026.05.29";
const outputRoot = resolve("store-assets/screenshots");

const devices = [
  {
    id: "apple-iphone-69",
    browserType: webkit,
    viewport: { width: 430, height: 932 },
    deviceScaleFactor: 3,
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
  },
  {
    id: "google-phone",
    browserType: chromium,
    viewport: { width: 540, height: 960 },
    deviceScaleFactor: 2,
    userAgent:
      "Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36",
  },
];

const shots = [
  {
    file: "01-classic-battle.png",
    selectedProfessions: { scene: "classic", a: "archer", b: "chain", ballCount: 2 },
    actions: [tapMainStart, tapSetupStart, waitForBattle],
  },
  {
    file: "02-profession-select.png",
    selectedProfessions: { scene: "classic", a: "spear", b: "mage", ballCount: 2 },
    actions: [tapMainStart],
  },
  {
    file: "03-item-mode.png",
    selectedProfessions: { scene: "items", a: null, b: null, ballCount: 6 },
    actions: [tapMainStart],
  },
  {
    file: "04-hero-battle.png",
    selectedProfessions: { scene: "heroes", a: "wukong", b: "zeus", ballCount: 2 },
    actions: [tapMainStart, tapSetupStart, waitForBattle],
  },
  {
    file: "05-settings-privacy.png",
    selectedProfessions: { scene: "classic", a: "spear", b: "mage", ballCount: 2 },
    actions: [tapMainSettings],
  },
];

const baseUrl = process.env.ASO_SCREENSHOT_URL || DEFAULT_BASE_URL;

for (const device of devices) {
  const browser = await device.browserType.launch();
  const deviceOutput = resolve(outputRoot, device.id);
  await mkdir(deviceOutput, { recursive: true });

  try {
    for (const shot of shots) {
      const context = await browser.newContext({
        colorScheme: "dark",
        deviceScaleFactor: device.deviceScaleFactor,
        hasTouch: true,
        isMobile: true,
        locale: "zh-CN",
        userAgent: device.userAgent,
        viewport: device.viewport,
      });

      await context.addInitScript(
        ({ legalVersion, selectedProfessions }) => {
          localStorage.clear();
          localStorage.setItem("bangbang.acceptedLegalVersion", legalVersion);
          localStorage.setItem("bangbang.selectedProfessions", JSON.stringify(selectedProfessions));
          localStorage.setItem(
            "bangbang.settings",
            JSON.stringify({
              analyticsEnabled: false,
              adsEnabled: false,
              iapEnabled: false,
              vibrationEnabled: false,
              musicEnabled: false,
              soundEffectsEnabled: false,
            }),
          );
        },
        {
          legalVersion: LEGAL_VERSION,
          selectedProfessions: shot.selectedProfessions,
        },
      );

      const page = await context.newPage();
      const errors = [];
      page.on("console", (message) => {
        if (message.type() === "error" || message.type() === "warning") {
          errors.push(`${message.type()}: ${message.text()}`);
        }
      });
      page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));

      await page.goto(baseUrl, { waitUntil: "networkidle" });
      await page.locator("#gameCanvas").waitFor({ state: "visible" });
      await page.waitForTimeout(900);

      for (const action of shot.actions || []) {
        await action(page);
      }

      const screenshotPath = resolve(deviceOutput, shot.file);
      await page.screenshot({ path: screenshotPath });

      if (errors.length) {
        console.warn(`${device.id}/${shot.file} captured with console warnings:`);
        for (const error of errors) {
          console.warn(`- ${error}`);
        }
      }

      console.log(`Captured ${screenshotPath}`);
      await context.close();
    }
  } finally {
    await browser.close();
  }
}

function point(page, xRatio, yRatio) {
  const viewport = page.viewportSize();
  return {
    x: Math.round(viewport.width * xRatio),
    y: Math.round(viewport.height * yRatio),
  };
}

async function tapMainStart(page) {
  await tapRatio(page, 0.5, 0.475);
  await page.waitForTimeout(500);
}

async function tapMainSettings(page) {
  await tapRatio(page, 0.5, 0.553);
  await page.waitForTimeout(500);
}

async function tapSetupStart(page) {
  await tapRatio(page, 0.72, 0.793);
  await page.waitForTimeout(800);
}

async function waitForBattle(page) {
  await page.waitForTimeout(2600);
}

async function tapRatio(page, xRatio, yRatio) {
  const target = point(page, xRatio, yRatio);
  await page.mouse.click(target.x, target.y);
}
