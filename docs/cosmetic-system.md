# 职业道具系统

职业视觉配置在 `cosmetics.js`，只影响挂件和攻击特效，不参与职业数值计算。

## 配置结构

```js
export const ProfessionCosmeticConfig = {
  spear: {
    profession: "spear",
    skinPacks: ["default", "sky-guard"],
    pendants: [
      {
        id: "spear-wind-trail",
        name: "破风尾迹",
        type: "trail",
        trigger: "always",
        effect: "motionTrail",
        color: "#49c5ff",
        duration: 0,
        rarity: "common",
        skinPack: "default",
      },
    ],
    attackEffects: [
      {
        id: "spear-front-thrust",
        name: "正面突刺线",
        type: "thrust",
        trigger: "skill",
        effect: "thrustLine",
        color: "#d8f4ff",
        duration: 0.22,
        rarity: "rare",
        skinPack: "default",
      },
    ],
  },
};
```

每个挂件和攻击特效都包含基础字段：

```text
id, name, effect, color, duration, rarity
```

当前额外字段：

```text
type, trigger, skinPack, limitedTag
```

## 示例调用

战斗对象初始化：

```js
import { createCosmeticState } from "./cosmetics.js";

class Ball {
  constructor() {
    this.cosmeticState = createCosmeticState();
  }
}
```

每帧更新和渲染挂件：

```js
import { renderBallPendants, updateBallCosmetics } from "./cosmetics.js";

ball.update = (deltaTime, currentTime) => {
  updateBallCosmetics(ball, currentTime);
};

ball.draw = (ctx, currentTime) => {
  renderBallPendants(ctx, ball, currentTime);
};
```

攻击命中时播放视觉特效：

```js
import {
  CosmeticTrigger,
  createAttackEffectInstances,
  triggerBallPendants,
} from "./cosmetics.js";

function onHit(attacker, defender, normal, currentTime) {
  triggerBallPendants(attacker, CosmeticTrigger.ATTACK, currentTime);
  attackEffectInstances.push(
    ...createAttackEffectInstances({
      attacker,
      defender,
      normal,
      trigger: CosmeticTrigger.ATTACK,
      currentTime,
    }),
  );
}
```

技能命中时只需要把触发方式换成 `CosmeticTrigger.SKILL`。新增职业时，在 `ProfessionCosmeticConfig` 里增加同名 key，例如 `assassin`、`hammer`，战斗代码不需要改动。
