import assert from "node:assert/strict";
import test from "node:test";

import {
  ATTACK_ANIMATION_CONFIG,
  ProfessionConfig,
  SIDE_VISUAL_CONFIG,
  getAttackAnimationConfig,
  getSpeedMultiplier,
} from "../game-config.js";
import { ProfessionCosmeticConfig } from "../cosmetics.js";

test("profession config exposes balanced, testable combat fields", () => {
  const professions = Object.keys(ProfessionConfig);

  assert.deepEqual(professions.sort(), ["blade", "shield", "spear"]);

  for (const [profession, config] of Object.entries(ProfessionConfig)) {
    assert.equal(config.id, profession);
    assert.equal(typeof config.name, "string");
    assert.ok(config.name.length > 0);
    assert.ok(config.maxHp > 0);
    assert.ok(config.radius > 0);
    assert.ok(config.moveSpeed > 0);
    assert.ok(config.attackDamage > 0);
    assert.ok(config.attackCooldown > 0);
    assert.ok(config.weaponRange > 0);
    assert.equal(typeof config.getDamage, "function");
    assert.equal(typeof config.getKnockbackMultiplier, "function");
    assert.equal(typeof config.isSkillHit, "function");
    assert.ok(config.getKnockbackMultiplier() > 0);
  }
});

test("combat and cosmetic profession lists stay in sync", () => {
  assert.deepEqual(
    Object.keys(ProfessionCosmeticConfig).sort(),
    Object.keys(ProfessionConfig).sort(),
  );
});

test("spear front thrust upgrades damage only while facing the enemy", () => {
  const spear = ProfessionConfig.spear;
  const defender = { hp: 100 };

  const frontalAttacker = {
    velocity: { x: 1, y: 0 },
    attackState: { direction: { x: 1, y: 0 } },
  };
  const sideAttacker = {
    velocity: { x: 0, y: 1 },
    attackState: { direction: { x: 0, y: 1 } },
  };

  assert.equal(spear.getDamage(frontalAttacker, defender, { x: 1, y: 0 }), 16);
  assert.equal(spear.getDamage(sideAttacker, defender, { x: 1, y: 0 }), 12);
  assert.equal(spear.isSkillHit(frontalAttacker, defender, { x: 1, y: 0 }, 16), true);
  assert.equal(spear.isSkillHit(sideAttacker, defender, { x: 1, y: 0 }, 12), false);
});

test("speed ramp and attack animation helpers clamp predictably", () => {
  assert.equal(getSpeedMultiplier(0), 1);
  assert.equal(getSpeedMultiplier(20), 3);
  assert.equal(getSpeedMultiplier(99), 3);
  assert.equal(getAttackAnimationConfig("unknown"), ATTACK_ANIMATION_CONFIG.default);
  assert.equal(getAttackAnimationConfig("blade").sweepAngle > 0, true);
});

test("side visuals include the fields used by the canvas renderer", () => {
  for (const side of ["A", "B"]) {
    assert.match(SIDE_VISUAL_CONFIG[side].color, /^#/);
    assert.match(SIDE_VISUAL_CONFIG[side].accentColor, /^#/);
    assert.match(SIDE_VISUAL_CONFIG[side].backgroundGlow, /^rgba/);
    assert.match(SIDE_VISUAL_CONFIG[side].bladeTrailIdle, /^rgba/);
    assert.match(SIDE_VISUAL_CONFIG[side].bladeTrailAttack, /^rgba/);
  }
});
