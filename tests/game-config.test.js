import assert from "node:assert/strict";
import test from "node:test";

import {
  ATTACK_ANIMATION_CONFIG,
  ProfessionConfig,
  SceneConfig,
  SIDE_VISUAL_CONFIG,
  getAttackAnimationConfig,
  getSceneProfessionIds,
  getSpeedMultiplier,
} from "../game-config.js";
import { ProfessionCosmeticConfig } from "../cosmetics.js";

test("profession config exposes balanced, testable combat fields", () => {
  const professions = Object.keys(ProfessionConfig);

  assert.deepEqual(professions.sort(), [
    "archer",
    "assassin",
    "bat",
    "blade",
    "chain",
    "frost",
    "lava",
    "mage",
    "reaper",
    "shield",
    "spear",
    "spider",
    "venom",
  ]);

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
    assert.equal(typeof config.item?.name, "string");
    assert.equal(typeof config.item?.type, "string");
    assert.equal(typeof config.item?.animation, "string");
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

test("scene config keeps classic and super profession pools separate", () => {
  assert.deepEqual(SceneConfig.classic.professionIds, ["spear", "blade", "shield", "assassin", "archer", "chain", "mage"]);
  assert.deepEqual(SceneConfig.super.professionIds, ["bat", "venom", "spider", "lava", "reaper", "frost"]);
  assert.equal(getSceneProfessionIds("super").includes("bat"), true);
  assert.equal(getSceneProfessionIds("super").includes("spear"), false);
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

test("new profession skills expose distinct combat hooks", () => {
  const attacker = {
    position: { x: 0, y: 0 },
    radius: 24,
    attackState: null,
  };
  const defender = {
    position: { x: 160, y: 0 },
    radius: 24,
  };

  assert.equal(ProfessionConfig.archer.weaponRange > ProfessionConfig.blade.weaponRange, true);
  assert.equal(Number.isFinite(ProfessionConfig.archer.weaponRange), false);
  assert.equal(ProfessionConfig.archer.attackMode, "projectile");
  assert.equal(ProfessionConfig.archer.projectileWeapon.speed > 0, true);
  assert.equal(ProfessionConfig.archer.projectileWeapon.headRadius > 0, true);
  assert.equal(ProfessionConfig.chain.getKnockbackMultiplier() > ProfessionConfig.spear.getKnockbackMultiplier(), true);
  assert.equal(ProfessionConfig.chain.attackMode, "chainSpin");
  assert.equal(ProfessionConfig.chain.chainWeapon.spinSpeed > 0, true);
  assert.equal(ProfessionConfig.chain.chainWeapon.headRadius > ProfessionConfig.blade.radius / 2, true);

  attacker.attackState = {
    variant: ProfessionConfig.mage.spellBook.find((spell) => spell.id === "fire"),
  };
  assert.equal(ProfessionConfig.mage.getDamage(attacker), 10);
  assert.equal(ProfessionConfig.mage.getAttackVariant(attacker, defender, 1).id.length > 0, true);
});

test("super arena professions expose their special combat contracts", () => {
  assert.equal(ProfessionConfig.bat.collisionDrain.damage > 0, true);
  assert.equal(ProfessionConfig.bat.collisionDrain.disableDuration > 0, true);
  assert.equal(ProfessionConfig.venom.venomSpike.poisonDamagePerSecond > 0, true);
  assert.equal(ProfessionConfig.spider.webLine.collisionRadius > 0, true);
  assert.equal(ProfessionConfig.lava.flameTrail.dropInterval > 0, true);
  assert.equal(ProfessionConfig.reaper.attackMode, "reaper");
  assert.equal(ProfessionConfig.reaper.attackCooldown > ProfessionConfig.blade.attackCooldown, true);
  assert.equal(ProfessionConfig.reaper.attackDamage > ProfessionConfig.blade.attackDamage, true);
  assert.equal(ProfessionConfig.frost.attackMode, "frostOrbit");
  assert.equal(ProfessionConfig.frost.frostOrbit.count >= 3, true);
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
