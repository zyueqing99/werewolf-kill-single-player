import { describe, expect, it } from "vitest";

import { buildServer, createFallbackAgentService } from "../../src/api/server";
import { GameSession } from "../../src/api/gameSession";

describe("HTTP API", () => {
  it("POST /api/game/start 返回真人可见状态", async () => {
    const app = buildServer(new GameSession(createFallbackAgentService()));
    const response = await app.inject({ method: "POST", url: "/api/game/start" });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.state.humanPlayerId).toBeTruthy();
    expect(body.state.human.role).toBeTruthy();
    expect(JSON.stringify(body)).not.toContain("seerChecks\":{\"");
  });

  it("GET /api/health 返回 ok", async () => {
    const app = buildServer(new GameSession(createFallbackAgentService()));
    const response = await app.inject({ method: "GET", url: "/api/health" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ ok: true });
  });

  it("POST /api/game/speech 接受真人发言", async () => {
    const app = buildServer(new GameSession(createFallbackAgentService()));
    const started = await app.inject({ method: "POST", url: "/api/game/start" });
    const state = started.json().state;
    const response = await app.inject({
      method: "POST",
      url: "/api/game/speech",
      payload: { playerId: state.humanPlayerId, content: "我先听发言。" }
    });

    expect([200, 409]).toContain(response.statusCode);
  });

  it("响应不包含完整内部玩家身份字段", async () => {
    const app = buildServer(new GameSession(createFallbackAgentService()));
    const response = await app.inject({ method: "POST", url: "/api/game/start" });
    const serialized = response.body;

    expect(serialized).not.toContain("\"night\"");
    expect(serialized).not.toContain("\"vote\"");
    expect(serialized).not.toContain("\"persona\"");
  });

  it("测试可以显式注入兜底 agent 服务", async () => {
    const app = buildServer(new GameSession(createFallbackAgentService()));
    const response = await app.inject({ method: "POST", url: "/api/game/start" });

    expect(response.statusCode).toBe(200);
  });
});
