import { describe, expect, it } from "vitest";

import { createGame } from "../../src/game/createGame";
import {
  fallbackSeerCheck,
  fallbackSpeech,
  fallbackVote,
  fallbackWerewolfKill,
  fallbackWitchAction
} from "../../src/game/fallbacks";

describe("agent 兜底策略", () => {
  it("发言兜底返回非空短文本", () => {
    expect(fallbackSpeech()).toMatch(/\S/);
  });

  it("狼人兜底优先选择存活非狼人", () => {
    const game = createGame({ rng: () => 0 });
    const wolf = game.players.find((player) => player.role === "werewolf");

    if (!wolf) throw new Error("测试夹具缺少狼人");

    const targetId = fallbackWerewolfKill(game, wolf.id);
    const target = game.players.find((player) => player.id === targetId);

    expect(target?.status).toBe("alive");
    expect(target?.role).not.toBe("werewolf");
  });

  it("预言家兜底选择未查验存活目标", () => {
    const game = createGame({ rng: () => 0 });
    const seer = game.players.find((player) => player.role === "seer");
    const checked = game.players.find((player) => player.id !== seer?.id);

    if (!seer || !checked) throw new Error("测试夹具缺少预言家");

    game.night.seerChecks[seer.id] = { [checked.id]: "villagers" };

    expect(fallbackSeerCheck(game, seer.id)).not.toBe(checked.id);
  });

  it("女巫兜底默认不用药", () => {
    expect(fallbackWitchAction()).toEqual({ useAntidote: false });
  });

  it("投票兜底在有候选目标时返回目标", () => {
    const game = { ...createGame({ rng: () => 0 }), phase: "day_vote" as const };

    expect(fallbackVote(game, "p1").targetId).toBeTruthy();
  });
});
