import assert from "node:assert/strict";
import test from "node:test";

import {
  ATTACK_ANIMATION_CONFIG,
  HERO_SCENE_ID,
  HeroConfig,
  ITEM_SCENE_ID,
  ItemBuildingConfig,
  ItemModePoolConfig,
  ItemModeBallConfig,
  ItemSpawnConfig,
  ItemWeaponConfig,
  ProfessionConfig,
  SceneConfig,
  SIDE_VISUAL_CONFIG,
  getAttackAnimationConfig,
  getItemDropPool,
  getItemInitialCount,
  getItemMaxActiveCount,
  getItemSpawnInterval,
  getSceneProfessionIds,
  getSpeedMultiplier,
  isHeroScene,
  isItemScene,
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
    "static",
    "summoner",
    "venom",
    "yoyo",
  ]);

  for (const [profession, config] of Object.entries(ProfessionConfig)) {
    assert.equal(config.id, profession);
    assert.equal(typeof config.name, "string");
    assert.ok(config.name.length > 0);
    assert.ok(config.maxHp > 0);
    assert.ok(config.radius > 0);
    assert.ok(config.moveSpeed > 0);
    if (config.attackMode === "summonBear") {
      assert.equal(config.attackDamage, 0);
    } else {
      assert.ok(config.attackDamage > 0);
    }
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
  assert.deepEqual(SceneConfig.classic.professionIds, ["spear", "blade", "shield", "assassin", "archer", "chain", "mage", "summoner"]);
  assert.deepEqual(SceneConfig.super.professionIds, ["bat", "venom", "spider", "lava", "reaper", "frost", "yoyo", "static"]);
  assert.equal(SceneConfig[ITEM_SCENE_ID].type, "items");
  assert.deepEqual(getSceneProfessionIds(ITEM_SCENE_ID), []);
  assert.equal(SceneConfig[ITEM_SCENE_ID].ballHp, 112);
  assert.equal(SceneConfig[HERO_SCENE_ID].type, "heroes");
  assert.deepEqual(SceneConfig[HERO_SCENE_ID].professionIds, ["demon", "dwarfKing", "minotaur", "elfKing", "wukong", "cryptLord", "zeus"]);
  assert.equal(isHeroScene(HERO_SCENE_ID), true);
  assert.equal(isHeroScene("classic"), false);
  assert.equal(isItemScene(ITEM_SCENE_ID), true);
  assert.equal(isItemScene("classic"), false);
  assert.equal(getSceneProfessionIds("super").includes("bat"), true);
  assert.equal(getSceneProfessionIds("super").includes("spear"), false);
});

test("hero mode config exposes health, mana, weapons, and skill contracts", () => {
  assert.deepEqual(Object.keys(HeroConfig).sort(), ["cryptLord", "demon", "dwarfKing", "elfKing", "minotaur", "wukong", "zeus"]);

  for (const [id, hero] of Object.entries(HeroConfig)) {
    assert.equal(hero.id, id);
    assert.equal(typeof hero.nameKey, "string");
    assert.equal(hero.nameKey.startsWith("heroes."), true);
    assert.equal(hero.maxHp > 0, true);
    assert.equal(hero.maxMp > 0, true);
    assert.equal(hero.manaRegen > 0, true);
    assert.equal(hero.radius > 0, true);
    assert.equal(hero.moveSpeed > 0, true);
    assert.equal(hero.attackDamage > 0, true);
    assert.equal(hero.attackCooldown > 0, true);
    assert.equal(hero.weaponRange > 0, true);
    assert.equal(typeof hero.attackMode, "string");
    assert.equal(typeof hero.bodyPattern, "string");
    assert.equal(typeof hero.item?.nameKey, "string");
    assert.equal(hero.item.nameKey.startsWith("heroes."), true);
    assert.equal(typeof hero.item?.type, "string");
    assert.equal(Array.isArray(hero.skills), true);
    assert.equal(hero.skills.length, 2);

    for (const skill of hero.skills) {
      assert.equal(typeof skill.id, "string");
      assert.equal(typeof skill.nameKey, "string");
      assert.equal(skill.nameKey.startsWith("heroes."), true);
      assert.equal(typeof skill.type, "string");
      assert.equal(skill.manaCost >= 0, true);
      assert.equal(skill.cooldown > 0 || skill.cooldown === Infinity, true);
    }
  }

  assert.equal(HeroConfig.demon.skills.some((skill) => skill.type === "passiveDodge" && skill.chance > 0), true);
  assert.equal(HeroConfig.demon.skills.some((skill) => skill.type === "aoeBurn" && skill.manaDamage > 0), true);
  assert.equal(HeroConfig.dwarfKing.skills.some((skill) => skill.type === "homingProjectile" && skill.stunDuration > 0), true);
  assert.equal(HeroConfig.dwarfKing.skills.some((skill) => skill.type === "groundSlam" && skill.slowDuration > 0), true);
  assert.equal(HeroConfig.minotaur.coneAngle, Math.PI / 2);
  assert.equal(HeroConfig.minotaur.skills.some((skill) => skill.oncePerMatch), true);
  assert.equal(
    HeroConfig.minotaur.skills.some((skill) => skill.type === "rebirth" && skill.reviveHpRatio > 0 && skill.reviveHpRatio <= 1),
    true,
  );
  assert.equal(HeroConfig.elfKing.attackMode, "projectile");
  assert.equal(HeroConfig.elfKing.skills.some((skill) => skill.type === "empoweredProjectile" && skill.manaCost > 0), true);
  assert.equal(HeroConfig.elfKing.skills.some((skill) => skill.type === "heal" && skill.heal > 0), true);
  assert.equal(HeroConfig.wukong.attackMode, "staff");
  assert.equal(HeroConfig.wukong.weaponRange >= 120, true);
  assert.equal(HeroConfig.wukong.skills.some((skill) => skill.id === "tripleStaff" && skill.staffCount === 3), true);
  assert.equal(HeroConfig.wukong.skills.some((skill) => skill.id === "giantStaff" && skill.rangeMultiplier === 5), true);
  assert.equal(new Set(HeroConfig.wukong.skills.map((skill) => skill.exclusiveGroup)).size, 1);
  assert.equal(HeroConfig.cryptLord.attackMode, "claw");
  assert.equal(HeroConfig.cryptLord.skills.some((skill) => skill.type === "impale" && skill.activeLength === 120 && skill.collisionRadius > 0), true);
  assert.equal(HeroConfig.cryptLord.skills.some((skill) => skill.type === "summonBeetle" && skill.maxCount === 3 && skill.maxHp === 1 && skill.damage === 1), true);
  assert.equal(HeroConfig.zeus.attackMode, "spear");
  assert.equal(HeroConfig.zeus.skills.some((skill) => skill.type === "delayedLightning" && skill.warningDuration > 0 && skill.damage > 0), true);
  assert.equal(HeroConfig.zeus.skills.some((skill) => skill.type === "divineDescent" && skill.radiusMultiplier > 1 && skill.healthMultiplier > 0), true);
});

test("item mode config is data-driven and numerically valid", () => {
  assert.equal(ItemModeBallConfig.maxHp, 112);
  assert.equal(ItemModeBallConfig.attackDamage, 0);
  assert.equal(ItemModeBallConfig.radius > 0, true);
  assert.equal(ItemModeBallConfig.moveSpeed > 0, true);
  assert.equal(ItemSpawnConfig.initialCount > 0, true);
  assert.equal(ItemSpawnConfig.maxActive >= ItemSpawnConfig.initialCount, true);
  assert.equal(ItemSpawnConfig.spawnInterval > 0, true);
  assert.equal(ItemSpawnConfig.pickupRadius > 0, true);
  assert.equal(ItemSpawnConfig.avoidItemRadius > ItemSpawnConfig.pickupRadius, true);
  assert.equal(ItemSpawnConfig.recentSpawnAvoidRadius >= ItemSpawnConfig.avoidItemRadius, true);
  assert.equal(ItemSpawnConfig.recentSpawnAvoidDuration > 0, true);
  assert.equal(ItemSpawnConfig.spawnAttempts >= 24, true);
  assert.equal(ItemSpawnConfig.retryInterval > 0 && ItemSpawnConfig.retryInterval < ItemSpawnConfig.spawnInterval, true);
  assert.equal(ItemModePoolConfig.weaponCount, 6);
  assert.equal(ItemModePoolConfig.buildingCount, 4);
  assert.deepEqual(ItemModePoolConfig.requiredBuildingIds, ["gasStation"]);
  assert.equal(getItemInitialCount(2), ItemSpawnConfig.initialCount);
  assert.equal(getItemInitialCount(6) > getItemInitialCount(2), true);
  assert.equal(getItemMaxActiveCount(6) > getItemMaxActiveCount(2), true);
  assert.equal(getItemSpawnInterval(6) < getItemSpawnInterval(2), true);
  const itemDropPool = getItemDropPool(12345);
  assert.equal(itemDropPool.length, 10);
  assert.equal(itemDropPool.filter((entry) => entry.type === "weapon").length, 6);
  assert.equal(itemDropPool.filter((entry) => entry.type === "building").length, 4);
  assert.equal(itemDropPool.some((entry) => entry.type === "building" && entry.id === "gasStation"), true);
  assert.deepEqual(getItemDropPool(12345), itemDropPool);
  assert.notDeepEqual(getItemDropPool(12346), itemDropPool);

  const weaponIds = Object.keys(ItemWeaponConfig).sort();
  assert.deepEqual(weaponIds, ["bow", "flamethrower", "pistol", "rocket", "spear", "staff", "sword", "torch"]);

  for (const [id, weapon] of Object.entries(ItemWeaponConfig)) {
    assert.equal(weapon.id, id);
    assert.equal(typeof weapon.nameKey, "string");
    assert.equal(weapon.nameKey.startsWith("items."), true);
    assert.equal(["melee", "projectile", "rocket", "spell", "cone"].includes(weapon.kind), true);
    assert.equal(weapon.damage > 0, true);
    assert.equal(weapon.cooldown > 0, true);
    assert.equal(weapon.range > 0, true);
    assert.equal(weapon.durability > 0, true);
    assert.equal(weapon.knockbackMultiplier > 0, true);

    if (weapon.kind === "projectile" || weapon.kind === "rocket") {
      assert.equal(weapon.speed > 0, true);
      assert.equal(weapon.headRadius > 0, true);
      assert.equal(weapon.shaftLength > 0, true);
      assert.equal(typeof weapon.projectileKind, "string");
    }
  }

  assert.equal(ItemWeaponConfig.rocket.explosionDamage > 0, true);
  assert.equal(ItemWeaponConfig.rocket.explosionRadius > 0, true);
  assert.equal(ItemWeaponConfig.flamethrower.kind, "cone");
  assert.equal(ItemWeaponConfig.flamethrower.minDamage < ItemWeaponConfig.flamethrower.damage, true);
  assert.equal(ItemWeaponConfig.flamethrower.coneAngle > 0 && ItemWeaponConfig.flamethrower.coneAngle < Math.PI, true);
  assert.equal(ItemWeaponConfig.staff.spellBook.length, 3);
  assert.equal(ItemWeaponConfig.torch.durability, 1);
  assert.equal(ItemWeaponConfig.torch.projectileKind, "torch");
  assert.equal(ItemWeaponConfig.torch.groundFire.radius > 0, true);
  assert.equal(ItemWeaponConfig.torch.groundFire.duration > 0, true);
  for (const spell of ItemWeaponConfig.staff.spellBook) {
    assert.equal(typeof spell.id, "string");
    assert.equal(spell.damage > 0, true);
    assert.equal(spell.knockbackMultiplier > 0, true);
  }

  const buildingIds = Object.keys(ItemBuildingConfig).sort();
  assert.deepEqual(buildingIds, ["bunker", "cannon", "gasStation", "prismTower", "teslaCoil"]);
  for (const [id, building] of Object.entries(ItemBuildingConfig)) {
    assert.equal(building.id, id);
    assert.equal(building.kind, "building");
    assert.equal(building.nameKey.startsWith("items."), true);
    assert.equal(building.radius > 0, true);
    assert.equal(building.duration > 0, true);
    if (building.supportKind === "heal") {
      assert.equal(building.damage, 0);
      assert.equal(building.cooldown, 0);
      assert.equal(building.range, 0);
      assert.equal(building.knockbackMultiplier, 0);
      assert.equal(building.healAmount > 0, true);
      assert.equal(building.healDuration > 0, true);
    } else {
      assert.equal(building.damage > 0, true);
      assert.equal(building.cooldown > 0, true);
      assert.equal(building.range > 0, true);
      assert.equal(building.knockbackMultiplier > 0, true);
    }
  }
  assert.equal(ItemBuildingConfig.prismTower.refractionRadius > 0, true);
  assert.equal(ItemBuildingConfig.bunker.bulletCount, 6);
  assert.equal(ItemBuildingConfig.cannon.cooldown > ItemBuildingConfig.bunker.cooldown, true);
  assert.equal(ItemBuildingConfig.cannon.damage > ItemBuildingConfig.bunker.damage, true);
  assert.equal(ItemBuildingConfig.cannon.canTargetBuildings, true);
  assert.equal(ItemBuildingConfig.cannon.destroyBuildingsOnHit, true);
  assert.equal(ItemBuildingConfig.teslaCoil.maxAttacks, 3);
  assert.equal(ItemBuildingConfig.teslaCoil.paralyzeDuration > 0, true);
  assert.equal(ItemBuildingConfig.gasStation.supportKind, "heal");
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
  assert.equal(ProfessionConfig.summoner.attackMode, "summonBear");
  assert.equal(ProfessionConfig.summoner.attackDamage, 0);
  assert.equal(ProfessionConfig.summoner.summonBear.baseDamage > 0, true);
  assert.equal(ProfessionConfig.summoner.summonBear.damageGainPerOwnerHit > 0, true);
  assert.equal(ProfessionConfig.summoner.summonBear.radiusGainPerCollision > 0, true);
  assert.equal(ProfessionConfig.summoner.summonBear.maxRadiusMultiplier > 1, true);
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
  assert.equal(ProfessionConfig.yoyo.attackMode, "yoyo");
  assert.equal(ProfessionConfig.yoyo.yoyoWeapon.lineDamage > 0, true);
  assert.equal(ProfessionConfig.yoyo.yoyoWeapon.lineRadius > 0, true);
  assert.equal(ProfessionConfig.yoyo.yoyoWeapon.cooldown > 0, true);
  assert.equal(ProfessionConfig.yoyo.yoyoWeapon.activeDuration > ProfessionConfig.yoyo.yoyoWeapon.extendDuration, true);
  assert.equal(ProfessionConfig.static.attackMode, "staticCharge");
  assert.equal(ProfessionConfig.static.staticCharge.chargeDuration > 0, true);
  assert.equal(ProfessionConfig.static.staticCharge.shockDamagePerSecond > 0, true);
  assert.equal(ProfessionConfig.static.staticCharge.paralyzeDuration > 0, true);
});

test("speed ramp and attack animation helpers clamp predictably", () => {
  assert.equal(getSpeedMultiplier(0), 1);
  assert.equal(getSpeedMultiplier(20), 3);
  assert.equal(getSpeedMultiplier(99), 3);
  assert.equal(getAttackAnimationConfig("unknown"), ATTACK_ANIMATION_CONFIG.default);
  assert.equal(getAttackAnimationConfig("blade").sweepAngle > 0, true);
  assert.equal(getAttackAnimationConfig("staff").sweepAngle > 0, true);
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
