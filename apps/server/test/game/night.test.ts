import { describe, expect, it } from "vitest";

import { createGame } from "../../src/game/createGame";
import { getPoisonCandidates } from "../../src/game/rules";
import {
  advanceAfterNight,
  submitSeerCheck,
  submitWerewolfKill,
  submitWitchAction
} from "../../src/game/reducer";

describe("夜晚结算", () => {
  it("狼人击杀会记录当晚被杀目标", () => {
    const game = createGame({ rng: () => 0 });
    const wolf = game.players.find((player) => player.role === "werewolf");
    const target = game.players.find((player) => player.role !== "werewolf");

    if (!wolf || !target) throw new Error("测试夹具创建失败");

    const next = submitWerewolfKill(game, wolf.id, target.id);

    expect(next.night.werewolfTargetId).toBe(target.id);
    expect(next.phase).toBe("night_seer");
  });

  it("预言家查验会记录目标阵营", () => {
    const game = createGame({ rng: () => 0 });
    const seer = game.players.find((player) => player.role === "seer");
    const wolf = game.players.find((player) => player.role === "werewolf");
    const villager = game.players.find((player) => player.role === "villager");

    if (!seer || !wolf || !villager) throw new Error("测试夹具创建失败");

    const checkedWolf = submitSeerCheck({ ...game, phase: "night_seer" }, seer.id, wolf.id);
    const checkedVillager = submitSeerCheck({ ...game, phase: "night_seer" }, seer.id, villager.id);

    expect(checkedWolf.night.seerChecks[seer.id]?.[wolf.id]).toBe("werewolves");
    expect(checkedVillager.night.seerChecks[seer.id]?.[villager.id]).toBe("villagers");
    expect(checkedVillager.phase).toBe("night_witch");
  });

  it("女巫解药阻止被杀目标死亡并消耗解药", () => {
    const game = createGame({ rng: () => 0 });
    const victim = game.players.find((player) => player.role !== "werewolf");
    const witch = game.players.find((player) => player.role === "witch");

    if (!victim || !witch) throw new Error("测试夹具创建失败");

    const acted = submitWitchAction(
      {
        ...game,
        phase: "night_witch",
        night: { ...game.night, werewolfTargetId: victim.id }
      },
      witch.id,
      { useAntidote: true }
    );
    const resolved = advanceAfterNight(acted);

    expect(resolved.players.find((player) => player.id === victim.id)?.status).toBe("alive");
    expect(resolved.night.witchHasAntidote).toBe(false);
  });

  it("女巫毒药杀死目标并消耗毒药", () => {
    const game = createGame({ rng: () => 0 });
    const witch = game.players.find((player) => player.role === "witch");
    const target = game.players.find((player) => player.id !== witch?.id && player.status === "alive");

    if (!witch || !target) throw new Error("测试夹具创建失败");

    const acted = submitWitchAction({ ...game, phase: "night_witch" }, witch.id, {
      poisonTargetId: target.id
    });
    const resolved = advanceAfterNight(acted);

    expect(resolved.players.find((player) => player.id === target.id)?.status).toBe("dead");
    expect(resolved.night.witchHasPoison).toBe(false);
  });

  it("已死亡玩家不会出现在后续候选目标中", () => {
    const game = createGame({ rng: () => 0 });
    const deadPlayer = game.players[0];

    if (!deadPlayer) throw new Error("测试夹具创建失败");

    deadPlayer.status = "dead";

    expect(getPoisonCandidates(game, "p2")).not.toContain(deadPlayer.id);
  });
});
