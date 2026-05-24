import assert from "node:assert/strict";
import test from "node:test";

import {
  LOCALE_STORAGE_KEY,
  SUPPORTED_LOCALES,
  getClientLocaleCandidates,
  getInitialLocale,
  getLocalizedLegalDocument,
  getLocaleOptions,
  getSavedLocale,
  getTextDirection,
  normalizeLocale,
  saveLocale,
  translate,
} from "../i18n.js";
import { createMemoryStorage } from "../compliance-state.js";

test("i18n exposes the requested locales and fallback behavior", () => {
  assert.deepEqual(SUPPORTED_LOCALES, ["zh", "zh-TW", "ja", "en", "fr", "de", "ar"]);
  assert.equal(normalizeLocale("zh-Hant-TW"), "zh-TW");
  assert.equal(normalizeLocale("zh-HK"), "zh-TW");
  assert.equal(normalizeLocale("en-US"), "en");
  assert.equal(normalizeLocale("ja-JP"), "ja");
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
    assert.notEqual(translate(locale, "settings.feedbackTitle"), "settings.feedbackTitle");
    assert.notEqual(translate(locale, "settings.vibration"), "settings.vibration");
    assert.notEqual(translate(locale, "settings.music"), "settings.music");
    assert.notEqual(translate(locale, "settings.soundEffects"), "settings.soundEffects");
    assert.notEqual(translate(locale, "professions.archer.name"), "professions.archer.name");
    assert.notEqual(translate(locale, "professions.bat.name"), "professions.bat.name");
    assert.notEqual(translate(locale, "professions.summoner.name"), "professions.summoner.name");
    assert.notEqual(translate(locale, "professions.yoyo.name"), "professions.yoyo.name");
    assert.notEqual(translate(locale, "scenes.super.name"), "scenes.super.name");
    assert.notEqual(translate(locale, "scenes.items.name"), "scenes.items.name");
    assert.notEqual(translate(locale, "scenes.heroes.name"), "scenes.heroes.name");
    assert.notEqual(translate(locale, "setup.itemModeHeader"), "setup.itemModeHeader");
    assert.notEqual(translate(locale, "items.sword.name"), "items.sword.name");
    assert.notEqual(translate(locale, "items.spear.name"), "items.spear.name");
    assert.notEqual(translate(locale, "items.bow.name"), "items.bow.name");
    assert.notEqual(translate(locale, "items.pistol.name"), "items.pistol.name");
    assert.notEqual(translate(locale, "items.rocket.name"), "items.rocket.name");
    assert.notEqual(translate(locale, "items.staff.name"), "items.staff.name");
    assert.notEqual(translate(locale, "heroes.demon.name"), "heroes.demon.name");
    assert.notEqual(translate(locale, "heroes.dwarfKing.weapon"), "heroes.dwarfKing.weapon");
    assert.notEqual(translate(locale, "heroes.minotaur.skills.rebirth"), "heroes.minotaur.skills.rebirth");
    assert.notEqual(translate(locale, "heroes.elfKing.skills.fireArrow"), "heroes.elfKing.skills.fireArrow");
    assert.notEqual(translate(locale, "heroes.wukong.skills.giantStaff"), "heroes.wukong.skills.giantStaff");
    assert.match(translate(locale, "result.winner", { side: "A", profession: "Archer" }), /A|Archer|الكرة/);
    assert.match(translate(locale, "result.winnerNoProfession", { side: "A" }), /A|الكرة/);
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

  const traditionalDocument = getLocalizedLegalDocument("zh-TW", "privacy", {
    appName: "Arena",
    companyName: "Example Co.",
    contactEmail: "privacy@example.com",
  });
  assert.equal(traditionalDocument.title, "隱私政策");

  const japaneseDocument = getLocalizedLegalDocument("ja-JP", "privacy", {
    appName: "Arena",
    companyName: "Example Co.",
    contactEmail: "privacy@example.com",
  });
  assert.equal(japaneseDocument.title, "プライバシーポリシー");
});

test("locale persistence uses safe storage", () => {
  const storage = createMemoryStorage();
  assert.equal(getSavedLocale(storage), null);
  assert.equal(saveLocale("de-DE", storage), "de");
  assert.equal(storage.getItem(LOCALE_STORAGE_KEY), "de");
  assert.equal(getSavedLocale(storage), "de");
  assert.equal(getInitialLocale(storage), "de");
  assert.equal(saveLocale("zh-HK", storage), "zh-TW");
  assert.equal(storage.getItem(LOCALE_STORAGE_KEY), "zh-TW");
  assert.equal(getInitialLocale(storage), "zh-TW");
});

test("saved locale wins over client language environment", () => {
  const storage = createMemoryStorage({
    [LOCALE_STORAGE_KEY]: "fr-FR",
  });
  const client = {
    navigator: { languages: ["ja-JP", "en-US"], language: "de-DE" },
    Intl: { DateTimeFormat: () => ({ resolvedOptions: () => ({ locale: "ar-SA" }) }) },
  };

  assert.equal(getInitialLocale(storage, client), "fr");
});

test("browser locale detection skips unsupported languages", () => {
  const originalNavigator = globalThis.navigator;
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: { languages: ["es-ES", "ja-JP", "fr-FR"] },
  });

  assert.equal(getInitialLocale(createMemoryStorage()), "ja");

  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: originalNavigator,
  });
});

test("client locale detection covers navigator variants and Intl fallback", () => {
  assert.deepEqual(getClientLocaleCandidates({
    navigator: {
      languages: ["es-ES", "ja-JP"],
      language: "fr-FR",
      userLanguage: "de-DE",
      browserLanguage: "ar-SA",
    },
    Intl: { DateTimeFormat: () => ({ resolvedOptions: () => ({ locale: "zh-Hant-TW" }) }) },
  }), ["es-ES", "ja-JP", "fr-FR", "de-DE", "ar-SA", "zh-Hant-TW"]);

  assert.equal(getInitialLocale(createMemoryStorage(), {
    navigator: { languages: ["es-ES"] },
    Intl: { DateTimeFormat: () => ({ resolvedOptions: () => ({ locale: "de-DE" }) }) },
  }), "de");
});
