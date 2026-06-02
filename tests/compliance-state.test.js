import assert from "node:assert/strict";
import test from "node:test";

import {
  ComplianceStorageKeys,
  DefaultReviewPromptState,
  DefaultSettings,
  REVIEW_SESSION_MIN_GAP_MS,
  createComplianceState,
  createMemoryStorage,
  normalizeReviewPromptState,
  normalizeSelectedProfessions,
} from "../compliance-state.js";
import { LegalConfig } from "../legal-config.js";

test("unaccepted users are blocked from current legal version", () => {
  const state = createComplianceState({ storage: createMemoryStorage() });

  assert.equal(state.hasAcceptedCurrentLegal(), false);
});

test("accepting current legal version persists across state instances", () => {
  const storage = createMemoryStorage();
  const state = createComplianceState({ storage });

  state.acceptCurrentLegal();

  assert.equal(createComplianceState({ storage }).hasAcceptedCurrentLegal(), true);
  assert.equal(storage.getItem(ComplianceStorageKeys.acceptedLegalVersion), LegalConfig.version);
});

test("legal version upgrades require a fresh consent", () => {
  const storage = createMemoryStorage({
    [ComplianceStorageKeys.acceptedLegalVersion]: "old-version",
  });
  const state = createComplianceState({ storage });

  assert.equal(state.hasAcceptedCurrentLegal(), false);
});

test("withdrawing consent clears only the accepted legal version", () => {
  const storage = createMemoryStorage();
  const state = createComplianceState({ storage });

  state.acceptCurrentLegal();
  state.saveSelectedProfessions({ a: "shield", b: "spear" });
  state.withdrawConsent();

  assert.equal(state.hasAcceptedCurrentLegal(), false);
  assert.deepEqual(state.getSelectedProfessions(), { scene: "classic", a: "shield", b: "spear", ballCount: 2 });
});

test("selected professions are normalized, saved, and restored", () => {
  const storage = createMemoryStorage();
  const state = createComplianceState({ storage });

  assert.deepEqual(state.getSelectedProfessions(), { scene: "classic", a: "spear", b: "blade", ballCount: 2 });
  assert.deepEqual(state.saveSelectedProfessions({ scene: "classic", a: "shield", b: "spear", ballCount: 6 }), {
    scene: "classic",
    a: "shield",
    b: "spear",
    ballCount: 6,
  });
  assert.deepEqual(normalizeSelectedProfessions({ scene: "classic", a: "summoner", b: "blade" }), {
    scene: "classic",
    a: "summoner",
    b: "blade",
    ballCount: 2,
  });
  assert.deepEqual(createComplianceState({ storage }).getSelectedProfessions(), {
    scene: "classic",
    a: "shield",
    b: "spear",
    ballCount: 6,
  });
});

test("unknown selected professions fall back to defaults", () => {
  assert.deepEqual(normalizeSelectedProfessions({ a: "wizard", b: "missing", ballCount: 99 }), {
    scene: "classic",
    a: "spear",
    b: "blade",
    ballCount: 6,
  });
});

test("super arena selection uses only super arena professions", () => {
  assert.deepEqual(normalizeSelectedProfessions({ scene: "super", a: "spear", b: "mage", ballCount: 4 }), {
    scene: "super",
    a: "bat",
    b: "venom",
    ballCount: 4,
  });

  assert.deepEqual(normalizeSelectedProfessions({ scene: "super", a: "reaper", b: "frost" }), {
    scene: "super",
    a: "reaper",
    b: "frost",
    ballCount: 2,
  });

  assert.deepEqual(normalizeSelectedProfessions({ scene: "super", a: "yoyo", b: "venom" }), {
    scene: "super",
    a: "yoyo",
    b: "venom",
    ballCount: 2,
  });
});

test("hero mode selection uses only hero ids", () => {
  assert.deepEqual(normalizeSelectedProfessions({ scene: "heroes", a: "spear", b: "mage", ballCount: 4 }), {
    scene: "heroes",
    a: "demon",
    b: "dwarfKing",
    ballCount: 4,
  });

  assert.deepEqual(normalizeSelectedProfessions({ scene: "heroes", a: "minotaur", b: "elfKing" }), {
    scene: "heroes",
    a: "minotaur",
    b: "elfKing",
    ballCount: 2,
  });

  assert.deepEqual(normalizeSelectedProfessions({ scene: "heroes", a: "wukong", b: "elfKing" }), {
    scene: "heroes",
    a: "wukong",
    b: "elfKing",
    ballCount: 2,
  });
});

test("item mode selection saves and restores without professions", () => {
  assert.deepEqual(normalizeSelectedProfessions({ scene: "items", a: "spear", b: "venom", ballCount: 4 }), {
    scene: "items",
    a: null,
    b: null,
    ballCount: 4,
  });

  const storage = createMemoryStorage();
  const state = createComplianceState({ storage });
  assert.deepEqual(state.saveSelectedProfessions({ scene: "items", a: "blade", b: "frost" }), {
    scene: "items",
    a: null,
    b: null,
    ballCount: 2,
  });
  assert.deepEqual(createComplianceState({ storage }).getSelectedProfessions(), {
    scene: "items",
    a: null,
    b: null,
    ballCount: 2,
  });
});

test("URL-style overrides take precedence over saved professions when valid", () => {
  const storage = createMemoryStorage();
  const state = createComplianceState({ storage });

  state.saveSelectedProfessions({ a: "shield", b: "spear", ballCount: 4 });

  assert.deepEqual(state.getSelectedProfessions({ scene: "super", a: "reaper", ballCount: 5 }), {
    scene: "super",
    a: "reaper",
    b: "venom",
    ballCount: 5,
  });

  assert.deepEqual(state.getSelectedProfessions({ scene: "items", a: "reaper" }), {
    scene: "items",
    a: null,
    b: null,
    ballCount: 4,
  });
});

test("feedback settings default on and persist toggles", () => {
  const storage = createMemoryStorage();
  const state = createComplianceState({ storage });

  assert.equal(DefaultSettings.vibrationEnabled, true);
  assert.equal(DefaultSettings.musicEnabled, true);
  assert.equal(DefaultSettings.soundEffectsEnabled, true);
  assert.equal(DefaultSettings.reducedShakeEnabled, false);
  assert.equal(DefaultSettings.highlightTextEnabled, true);
  assert.equal(DefaultSettings.compactReportEnabled, false);
  assert.equal(DefaultSettings.quickSettlementEnabled, false);
  assert.equal(state.getSettings().vibrationEnabled, true);
  assert.equal(state.getSettings().musicEnabled, true);
  assert.equal(state.getSettings().soundEffectsEnabled, true);
  assert.equal(state.getSettings().reducedShakeEnabled, false);
  assert.equal(state.getSettings().highlightTextEnabled, true);
  assert.equal(state.getSettings().compactReportEnabled, false);
  assert.equal(state.getSettings().quickSettlementEnabled, false);

  state.saveSettings({
    vibrationEnabled: false,
    musicEnabled: false,
    soundEffectsEnabled: false,
    reducedShakeEnabled: true,
    highlightTextEnabled: false,
    compactReportEnabled: true,
    quickSettlementEnabled: true,
  });

  assert.deepEqual(createComplianceState({ storage }).getSettings(), {
    ...DefaultSettings,
    vibrationEnabled: false,
    musicEnabled: false,
    soundEffectsEnabled: false,
    reducedShakeEnabled: true,
    highlightTextEnabled: false,
    compactReportEnabled: true,
    quickSettlementEnabled: true,
  });
});

test("review prompt state defaults, normalizes, and persists", () => {
  const storage = createMemoryStorage();
  const state = createComplianceState({ storage });

  assert.deepEqual(state.getReviewPromptState(), DefaultReviewPromptState);
  assert.deepEqual(normalizeReviewPromptState({
    sessionCount: "3",
    lastSessionStartedAt: "100.4",
    lastPromptedAt: "200.6",
    lastPromptedVersion: 42,
    promptAttemptCount: "-2",
    lastStoreListingOpenedAt: Number.NaN,
  }), {
    sessionCount: 3,
    lastSessionStartedAt: 100,
    lastPromptedAt: 201,
    lastPromptedVersion: "42",
    promptAttemptCount: 0,
    lastStoreListingOpenedAt: 0,
  });

  state.saveReviewPromptState({
    sessionCount: 2,
    lastSessionStartedAt: 123,
    lastPromptedAt: 456,
    lastPromptedVersion: "1.0.0",
    promptAttemptCount: 1,
    lastStoreListingOpenedAt: 789,
  });

  assert.deepEqual(createComplianceState({ storage }).getReviewPromptState(), {
    sessionCount: 2,
    lastSessionStartedAt: 123,
    lastPromptedAt: 456,
    lastPromptedVersion: "1.0.0",
    promptAttemptCount: 1,
    lastStoreListingOpenedAt: 789,
  });
});

test("review session tracking counts separated launches only", () => {
  const storage = createMemoryStorage();
  const state = createComplianceState({ storage });

  assert.equal(state.recordReviewSessionStarted({ nowMs: 1000 }).sessionCount, 1);
  assert.equal(state.recordReviewSessionStarted({ nowMs: 1000 + REVIEW_SESSION_MIN_GAP_MS - 1 }).sessionCount, 1);
  assert.equal(state.recordReviewSessionStarted({ nowMs: 1000 + REVIEW_SESSION_MIN_GAP_MS }).sessionCount, 2);
});
