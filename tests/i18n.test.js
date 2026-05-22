import assert from "node:assert/strict";
import test from "node:test";

import {
  SUPPORTED_LOCALES,
  getInitialLocale,
  getLocalizedLegalDocument,
  getLocaleOptions,
  getTextDirection,
  normalizeLocale,
  saveLocale,
  translate,
} from "../i18n.js";
import { createMemoryStorage } from "../compliance-state.js";

test("i18n exposes the requested locales and fallback behavior", () => {
  assert.deepEqual(SUPPORTED_LOCALES, ["zh", "en", "fr", "de", "ar"]);
  assert.equal(normalizeLocale("en-US"), "en");
  assert.equal(normalizeLocale("fr-FR"), "fr");
  assert.equal(normalizeLocale("de-DE"), "de");
  assert.equal(normalizeLocale("ar-SA"), "ar");
  assert.equal(normalizeLocale("unknown"), "zh");
  assert.equal(getTextDirection("ar"), "rtl");
  assert.equal(getTextDirection("de"), "ltr");
});

test("locale options and translations are complete enough for the UI", () => {
  assert.equal(getLocaleOptions().length, SUPPORTED_LOCALES.length);

  for (const locale of SUPPORTED_LOCALES) {
    assert.notEqual(translate(locale, "app.name"), "app.name");
    assert.notEqual(translate(locale, "main.start"), "main.start");
    assert.notEqual(translate(locale, "professions.archer.name"), "professions.archer.name");
    assert.notEqual(translate(locale, "professions.bat.name"), "professions.bat.name");
    assert.notEqual(translate(locale, "scenes.super.name"), "scenes.super.name");
    assert.match(translate(locale, "result.winner", { side: "A", profession: "Archer" }), /A|Archer|الكرة/);
  }
});

test("localized legal documents interpolate store metadata", () => {
  const document = getLocalizedLegalDocument("en", "privacy", {
    appName: "Arena",
    companyName: "Example Co.",
    contactEmail: "privacy@example.com",
  });

  assert.equal(document.title, "Privacy Policy");
  assert.equal(document.sections.length > 0, true);
  assert.match(document.sections.at(-1).body, /Example Co\./);
  assert.match(document.sections.at(-1).body, /privacy@example\.com/);
});

test("locale persistence uses safe storage", () => {
  const storage = createMemoryStorage();
  assert.equal(saveLocale("de-DE", storage), "de");
  assert.equal(getInitialLocale(storage), "de");
});

test("browser locale detection skips unsupported languages", () => {
  const originalNavigator = globalThis.navigator;
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: { languages: ["es-ES", "fr-FR"] },
  });

  assert.equal(getInitialLocale(createMemoryStorage()), "fr");

  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: originalNavigator,
  });
});
