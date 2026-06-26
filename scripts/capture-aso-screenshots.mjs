import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

import { chromium, webkit } from "playwright";

import { LegalConfig, getLegalVersionKey } from "../legal-config.js";

const DEFAULT_BASE_URL = "http://localhost:4180/";
const LEGAL_VERSION = getLegalVersionKey(LegalConfig);
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
    file: "01-matchup-question-battle.png",
    selectedProfessions: { scene: "classic", a: "spear", b: "shield", ballCount: 2 },
    actions: [tapMainStart, tapSetupStart, waitForBattle],
  },
  {
    file: "02-pick-matchup.png",
    selectedProfessions: { scene: "classic", a: "spear", b: "shield", ballCount: 2 },
    actions: [tapMainStart],
  },
  {
    file: "03-result-verdict-next.png",
    selectedProfessions: { scene: "classic", a: "spear", b: "shield", ballCount: 2 },
    actions: [tapMainStart, tapSetupStart, waitForResult],
  },
  {
    file: "04-item-chaos.png",
    selectedProfessions: { scene: "items", a: null, b: null, ballCount: 6 },
    actions: [tapMainStart],
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
          globalThis.__bangbangInteractiveRects = [];
          localStorage.clear();
          localStorage.setItem("bangbang.acceptedLegalVersion", legalVersion);
          localStorage.setItem("bangbang.selectedProfessions", JSON.stringify(selectedProfessions));
          localStorage.setItem(
            "bangbang.playerProgress",
            JSON.stringify({
              totalMatches: 2,
              lifetime: {
                matches: 2,
                wins: 1,
                currentStreak: 1,
                bestStreak: 1,
              },
              mastery: {
                spear: { matches: 2, wins: 1 },
              },
            }),
          );
          localStorage.setItem(
            "bangbang.settings",
            JSON.stringify({
              analyticsEnabled: false,
              adsEnabled: false,
              iapEnabled: false,
              vibrationEnabled: false,
              musicEnabled: false,
              soundEffectsEnabled: false,
              quickSettlementEnabled: true,
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
  await tapElementById(page, "main-start");
  await page.waitForTimeout(500);
}

async function tapMainSettings(page) {
  await tapElementById(page, "main-settings");
  await page.waitForTimeout(500);
}

async function tapSetupStart(page) {
  await tapElementById(page, "setup-start");
  await page.waitForTimeout(800);
}

async function waitForBattle(page) {
  await page.waitForTimeout(2600);
}

async function waitForResult(page) {
  await waitForInteractiveElement(page, "result-recommend-next", 60000);
  await page.waitForTimeout(900);
}

async function tapElementById(page, id) {
  await waitForInteractiveElement(page, id, 8000);
  const rect = await page.evaluate((targetId) => {
    const entry = globalThis.__bangbangInteractiveRects?.find((item) => item.id === targetId);
    return entry?.rect || null;
  }, id);
  if (!rect) {
    throw new Error(`Missing interactive rect: ${id}`);
  }
  const target = {
    x: Math.round(rect.x + rect.width / 2),
    y: Math.round(rect.y + rect.height / 2),
  };
  await page.mouse.click(target.x, target.y);
}

async function waitForInteractiveElement(page, id, timeoutMs) {
  await page.waitForFunction(
    (targetId) => globalThis.__bangbangInteractiveRects?.some((entry) => entry.id === targetId),
    id,
    { timeout: timeoutMs },
  );
}
