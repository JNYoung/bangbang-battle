import assert from "node:assert/strict";
import test from "node:test";

import {
  ComplianceStorageKeys,
  createComplianceState,
  createMemoryStorage,
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
  assert.deepEqual(state.getSelectedProfessions(), { a: "shield", b: "spear", ballCount: 2 });
});

test("selected professions are normalized, saved, and restored", () => {
  const storage = createMemoryStorage();
  const state = createComplianceState({ storage });

  assert.deepEqual(state.getSelectedProfessions(), { a: "spear", b: "blade", ballCount: 2 });
  assert.deepEqual(state.saveSelectedProfessions({ a: "shield", b: "spear", ballCount: 6 }), {
    a: "shield",
    b: "spear",
    ballCount: 6,
  });
  assert.deepEqual(createComplianceState({ storage }).getSelectedProfessions(), {
    a: "shield",
    b: "spear",
    ballCount: 6,
  });
});

test("unknown selected professions fall back to defaults", () => {
  assert.deepEqual(normalizeSelectedProfessions({ a: "wizard", b: "missing", ballCount: 99 }), {
    a: "spear",
    b: "blade",
    ballCount: 6,
  });
});

test("URL-style overrides take precedence over saved professions when valid", () => {
  const storage = createMemoryStorage();
  const state = createComplianceState({ storage });

  state.saveSelectedProfessions({ a: "shield", b: "spear", ballCount: 4 });

  assert.deepEqual(state.getSelectedProfessions({ a: "blade", ballCount: 5 }), {
    a: "blade",
    b: "spear",
    ballCount: 5,
  });
});
