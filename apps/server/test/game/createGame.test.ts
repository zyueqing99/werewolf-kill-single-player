import { describe, expect, it } from "vitest";

import { createGame } from "../../src/game/createGame";

describe("createGame", () => {
  it("创建固定 6 人局并分配正确身份数量", () => {
    const game = createGame({ rng: () => 0 });

    expect(game.players).toHaveLength(6);
    expect(game.players.filter((player) => player.kind === "human")).toHaveLength(1);
    expect(game.phase).toBe("night_werewolf");

    const roleCounts = game.players.reduce<Record<string, number>>((counts, player) => {
      counts[player.role] = (counts[player.role] ?? 0) + 1;
      return counts;
    }, {});

    expect(roleCounts).toEqual({
      seer: 1,
      werewolf: 2,
      witch: 1,
      villager: 2
    });
  });
});
