import { describe, expect, it } from "vitest";

import { createGame } from "../../src/game/createGame";
import { resolveVotes, submitSpeech, submitVote } from "../../src/game/reducer";

describe("白天发言和投票", () => {
  it("发言会追加公开消息", () => {
    const game = { ...createGame({ rng: () => 0 }), phase: "day_speech" as const };
    const next = submitSpeech(game, "p1", "我先报一下信息。");

    expect(next.messages.at(-1)?.content).toBe("我先报一下信息。");
    expect(next.messages.at(-1)?.speakerId).toBe("p1");
  });

  it("同一玩家重复投票时后投覆盖前投", () => {
    const game = { ...createGame({ rng: () => 0 }), phase: "day_vote" as const };
    const first = submitVote(game, "p1", "p2");
    const second = submitVote(first, "p1", "p3");

    expect(second.vote.votes.p1).toBe("p3");
  });

  it("最高票目标被放逐", () => {
    const game = { ...createGame({ rng: () => 0 }), phase: "day_vote" as const };
    const voted = submitVote(submitVote(submitVote(game, "p1", "p2"), "p3", "p2"), "p4", "p5");
    const resolved = resolveVotes(voted);

    expect(resolved.players.find((player) => player.id === "p2")?.status).toBe("dead");
    expect(resolved.messages.at(-1)?.content).toContain("p2");
  });

  it("最高票平票时无人出局", () => {
    const game = { ...createGame({ rng: () => 0 }), phase: "day_vote" as const };
    const voted = submitVote(submitVote(game, "p1", "p2"), "p3", "p4");
    const resolved = resolveVotes(voted);

    expect(resolved.players.every((player) => player.status === "alive")).toBe(true);
    expect(resolved.messages.at(-1)?.content).toContain("平票");
  });
});
