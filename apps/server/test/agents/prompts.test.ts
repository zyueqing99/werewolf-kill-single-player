import { describe, expect, it } from "vitest";

import { createGame } from "../../src/game/createGame";
import { buildSpeechPrompt } from "../../src/agents/prompts";

describe("agent prompt 信息隔离", () => {
  it("村民 prompt 不包含狼人队友字段或隐藏身份列表", () => {
    const game = createGame({ rng: () => 0 });
    const villager = game.players.find((player) => player.kind === "agent" && player.role === "villager");

    if (!villager) throw new Error("测试夹具缺少村民 agent");

    const prompt = buildSpeechPrompt(game, villager.id);

    expect(prompt).not.toContain("werewolfAllyIds");
    expect(prompt).not.toContain("\"role\":\"werewolf\"");
    expect(prompt).toContain("当前阶段");
    expect(prompt).toContain("公开消息");
  });

  it("狼人 prompt 包含队友 ID", () => {
    const game = createGame({ rng: () => 0 });
    const wolf = game.players.find((player) => player.kind === "agent" && player.role === "werewolf");

    if (!wolf) throw new Error("测试夹具缺少狼人 agent");

    const ally = game.players.find((player) => player.role === "werewolf" && player.id !== wolf.id);
    const prompt = buildSpeechPrompt(game, wolf.id);

    expect(prompt).toContain(ally?.id);
  });
});
