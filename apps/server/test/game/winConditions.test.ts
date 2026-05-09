import { describe, expect, it } from "vitest";

import { createGame } from "../../src/game/createGame";
import { getWinner } from "../../src/game/rules";
import { resolveVotes } from "../../src/game/reducer";

describe("胜负判断", () => {
  it("狼人全灭时好人胜利", () => {
    const game = createGame({ rng: () => 0 });

    for (const player of game.players) {
      if (player.role === "werewolf") {
        player.status = "dead";
      }
    }

    expect(getWinner(game)).toBe("villagers");
  });

  it("狼人人数大于等于非狼人人数时狼人胜利", () => {
    const game = createGame({ rng: () => 0 });
    let killedVillagers = 0;

    for (const player of game.players) {
      if (player.role !== "werewolf" && killedVillagers < 2) {
        player.status = "dead";
        killedVillagers += 1;
      }
    }

    expect(getWinner(game)).toBe("werewolves");
  });

  it("双方都能继续时没有胜者", () => {
    const game = createGame({ rng: () => 0 });

    expect(getWinner(game)).toBeUndefined();
  });

  it("放逐结算后会写入胜者", () => {
    const game = { ...createGame({ rng: () => 0 }), phase: "day_vote" as const };
    const wolves = game.players.filter((player) => player.role === "werewolf");

    if (wolves.length !== 2 || !wolves[0] || !wolves[1]) throw new Error("测试夹具创建失败");

    wolves[1].status = "dead";

    const voted = {
      ...game,
      vote: {
        ...game.vote,
        votes: {
          p1: wolves[0].id,
          p2: wolves[0].id
        }
      }
    };

    const resolved = resolveVotes(voted);

    expect(resolved.winner).toBe("villagers");
    expect(resolved.phase).toBe("game_over");
  });
});
