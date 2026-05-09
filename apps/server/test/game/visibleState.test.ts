import { describe, expect, it } from "vitest";

import type { Role } from "@werewolf/shared";
import { createGame } from "../../src/game/createGame";
import type { GameState } from "../../src/game/types";
import { toAgentVisibleState, toHumanVisibleState } from "../../src/game/visibleState";

function gameWithHumanRole(role: Role): GameState {
  const game = createGame({ humanPlayerId: "p1", rng: () => 0 });
  const human = game.players.find((player) => player.id === "p1");
  const target = game.players.find((player) => player.role === role);

  if (!human || !target) {
    throw new Error("测试夹具创建失败");
  }

  const humanRole = human.role;
  human.role = role;
  target.role = humanRole;

  return game;
}

describe("toHumanVisibleState", () => {
  it("包含真人自己的身份", () => {
    const game = gameWithHumanRole("seer");
    const visible = toHumanVisibleState(game);

    expect(visible.human.role).toBe("seer");
  });

  it("真人是狼人时能看到狼队友 ID", () => {
    const game = gameWithHumanRole("werewolf");
    const visible = toHumanVisibleState(game);
    const allyIds = game.players
      .filter((player) => player.role === "werewolf" && player.id !== game.humanPlayerId)
      .map((player) => player.id);

    expect(visible.human.werewolfAllyIds).toEqual(allyIds);
  });

  it("真人是村民时看不到隐藏身份", () => {
    const game = gameWithHumanRole("villager");
    const visible = toHumanVisibleState(game);

    expect(visible.human.werewolfAllyIds).toEqual([]);
    expect(visible.players.every((player) => player.revealedRole === undefined)).toBe(true);
  });
});

describe("toAgentVisibleState", () => {
  it("狼人 agent 视角包含狼队友", () => {
    const game = createGame({ humanPlayerId: "p1", rng: () => 0 });
    const wolf = game.players.find((player) => player.kind === "agent" && player.role === "werewolf");

    if (!wolf) {
      throw new Error("测试夹具缺少狼人 agent");
    }

    const visible = toAgentVisibleState(game, wolf.id);
    const allyIds = game.players
      .filter((player) => player.role === "werewolf" && player.id !== wolf.id)
      .map((player) => player.id);

    expect(visible.private.werewolfAllyIds).toEqual(allyIds);
  });

  it("村民 agent 视角不包含隐藏身份", () => {
    const game = createGame({ humanPlayerId: "p1", rng: () => 0 });
    const villager = game.players.find((player) => player.kind === "agent" && player.role === "villager");

    if (!villager) {
      throw new Error("测试夹具缺少村民 agent");
    }

    const visible = toAgentVisibleState(game, villager.id);

    expect(visible.private.werewolfAllyIds).toEqual([]);
    expect(visible.players.every((player) => player.revealedRole === undefined)).toBe(true);
  });
});
