import { describe, expect, it } from "vitest";

import { createGame } from "../../src/game/createGame";
import { createAgentService } from "../../src/agents/agentService";

describe("agentService", () => {
  it("模型返回非法 JSON 时使用发言兜底", async () => {
    const game = createGame({ rng: () => 0 });
    const agent = game.players.find((player) => player.kind === "agent");

    if (!agent) throw new Error("测试夹具缺少 agent");

    const service = createAgentService({
      completeJson: async () => "不是 JSON"
    });

    await expect(service.speech(game, agent.id)).resolves.toMatch(/\S/);
  });

  it("模型返回非法目标时使用投票兜底", async () => {
    const game = { ...createGame({ rng: () => 0 }), phase: "day_vote" as const };
    const agent = game.players.find((player) => player.kind === "agent");

    if (!agent) throw new Error("测试夹具缺少 agent");

    const service = createAgentService({
      completeJson: async () => JSON.stringify({ targetId: "missing" })
    });

    await expect(service.vote(game, agent.id)).resolves.toEqual({});
  });

  it("能解析 Markdown 代码块中的 JSON", async () => {
    const game = createGame({ rng: () => 0 });
    const agent = game.players.find((player) => player.kind === "agent");

    if (!agent) throw new Error("测试夹具缺少 agent");

    const service = createAgentService({
      completeJson: async () => "```json\n{\"speech\":\"我会重点观察今天谁在强行带票。\"}\n```"
    });

    await expect(service.speech(game, agent.id)).resolves.toBe("我会重点观察今天谁在强行带票。");
  });
});
