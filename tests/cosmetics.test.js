import assert from "node:assert/strict";
import test from "node:test";

import {
  AttackEffectType,
  CosmeticTrigger,
  PendantType,
  ProfessionCosmeticConfig,
  Rarity,
  createAttackEffectInstances,
  createCosmeticState,
  getProfessionCosmetics,
  triggerBallPendants,
  updateAttackEffectInstances,
  updateBallCosmetics,
} from "../cosmetics.js";

test("cosmetic configs use complete, unique, extensible item records", () => {
  const ids = new Set();
  const validTriggers = new Set(Object.values(CosmeticTrigger));
  const validPendantTypes = new Set(Object.values(PendantType));
  const validAttackTypes = new Set(Object.values(AttackEffectType));
  const validRarities = new Set(Object.values(Rarity));

  for (const [profession, config] of Object.entries(ProfessionCosmeticConfig)) {
    assert.equal(config.profession, profession);
    assert.ok(Array.isArray(config.skinPacks));
    assert.ok(config.skinPacks.includes("default"));

    for (const pendant of config.pendants) {
      assertCosmeticRecord(pendant, ids, validTriggers, validRarities);
      assert.ok(validPendantTypes.has(pendant.type));
      assert.equal(typeof pendant.skinPack, "string");
    }

    for (const attackEffect of config.attackEffects) {
      assertCosmeticRecord(attackEffect, ids, validTriggers, validRarities);
      assert.ok(validAttackTypes.has(attackEffect.type));
      assert.ok(attackEffect.duration > 0);
      assert.equal(typeof attackEffect.skinPack, "string");
    }
  }
});

test("unknown professions resolve to empty cosmetics instead of failing", () => {
  assert.deepEqual(getProfessionCosmetics("assassin"), {
    profession: "assassin",
    skinPacks: [],
    pendants: [],
    attackEffects: [],
  });
});

test("pendant triggers are temporary and cleaned by current time", () => {
  const ball = {
    profession: "blade",
    cosmeticState: createCosmeticState(),
  };

  triggerBallPendants(ball, CosmeticTrigger.ATTACK, 10);
  assert.equal(ball.cosmeticState.triggeredPendants.length, 1);
  assert.equal(ball.cosmeticState.triggeredPendants[0].id, "blade-hit-shoulders");

  updateBallCosmetics(ball, 10.1);
  assert.equal(ball.cosmeticState.triggeredPendants.length, 1);

  updateBallCosmetics(ball, 11);
  assert.equal(ball.cosmeticState.triggeredPendants.length, 0);
});

test("attack effect instances snapshot positions and normalize normals", () => {
  const attacker = {
    profession: "spear",
    position: { x: 10, y: 20 },
    radius: 24,
  };
  const defender = {
    position: { x: 40, y: 50 },
    radius: 26,
  };

  const effects = createAttackEffectInstances({
    attacker,
    defender,
    normal: { x: 10, y: 0 },
    trigger: CosmeticTrigger.ATTACK,
    currentTime: 4,
  });

  assert.equal(effects.length, 1);
  assert.equal(effects[0].id, "spear-impact-spark");
  assert.deepEqual(effects[0].source, { x: 10, y: 20 });
  assert.deepEqual(effects[0].origin, { x: 40, y: 50 });
  assert.deepEqual(effects[0].normal, { x: 1, y: 0 });

  attacker.position.x = 999;
  assert.deepEqual(effects[0].source, { x: 10, y: 20 });
});

test("attack effect cleanup keeps active effects and expires old ones", () => {
  const effects = [
    { id: "active", startTime: 2, duration: 1 },
    { id: "expired", startTime: 0, duration: 1 },
  ];

  assert.deepEqual(updateAttackEffectInstances(effects, 2.5).map((effect) => effect.id), ["active"]);
});

function assertCosmeticRecord(record, ids, validTriggers, validRarities) {
  assert.equal(typeof record.id, "string");
  assert.ok(record.id.length > 0);
  assert.equal(ids.has(record.id), false, `duplicate cosmetic id: ${record.id}`);
  ids.add(record.id);

  assert.equal(typeof record.name, "string");
  assert.ok(record.name.length > 0);
  assert.equal(typeof record.effect, "string");
  assert.ok(record.effect.length > 0);
  assert.match(record.color, /^#/);
  assert.equal(typeof record.duration, "number");
  assert.ok(record.duration >= 0);
  assert.ok(validTriggers.has(record.trigger));
  assert.ok(validRarities.has(record.rarity));
}
