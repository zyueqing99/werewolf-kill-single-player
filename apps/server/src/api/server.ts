import Fastify from "fastify";

import { fallbackSpeech, fallbackVote, fallbackWerewolfKill, fallbackSeerCheck, fallbackWitchAction } from "../game/fallbacks";
import { GameSession } from "./gameSession";

function createFallbackAgentService() {
  return {
    async speech() {
      return fallbackSpeech();
    },
    async vote() {
      return fallbackVote();
    },
    async werewolfKill(game, agentId) {
      const targetId = fallbackWerewolfKill(game, agentId);
      return targetId ? { targetId } : {};
    },
    async seerCheck(game, agentId) {
      const targetId = fallbackSeerCheck(game, agentId);
      return targetId ? { targetId } : {};
    },
    async witchAction() {
      return fallbackWitchAction();
    }
  } as ConstructorParameters<typeof GameSession>[0];
}

export function buildServer(session = new GameSession(createFallbackAgentService())) {
  const app = Fastify({ logger: false });

  app.get("/api/health", async () => ({ ok: true }));

  app.post("/api/game/start", async () => ({ state: session.start() }));
  app.get("/api/game/state", async (_request, reply) => {
    try {
      return { state: session.state() };
    } catch (error) {
      return reply.status(404).send({ error: error instanceof Error ? error.message : "未知错误" });
    }
  });

  app.post("/api/game/speech", async (request, reply) => {
    try {
      return { state: await session.submitSpeech(request.body as never) };
    } catch (error) {
      return reply.status(409).send({ error: error instanceof Error ? error.message : "未知错误" });
    }
  });

  app.post("/api/game/vote", async (request, reply) => {
    try {
      return { state: await session.submitVote(request.body as never) };
    } catch (error) {
      return reply.status(409).send({ error: error instanceof Error ? error.message : "未知错误" });
    }
  });

  app.post("/api/game/night-action", async (request, reply) => {
    try {
      return { state: await session.submitNightAction(request.body as never) };
    } catch (error) {
      return reply.status(409).send({ error: error instanceof Error ? error.message : "未知错误" });
    }
  });

  app.post("/api/game/next", async (_request, reply) => {
    try {
      return { state: await session.next() };
    } catch (error) {
      return reply.status(409).send({ error: error instanceof Error ? error.message : "未知错误" });
    }
  });

  return app;
}
