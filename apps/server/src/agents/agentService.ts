import type { GameState } from "../game/types";
import {
  fallbackSeerCheck,
  fallbackSpeech,
  fallbackVote,
  fallbackWerewolfKill,
  fallbackWitchAction,
  type VoteDecision,
  type WitchDecision
} from "../game/fallbacks";
import { getPoisonCandidates, getSeerCandidates, getVoteCandidates, getWerewolfKillCandidates } from "../game/rules";
import {
  buildSeerCheckPrompt,
  buildSpeechPrompt,
  buildVotePrompt,
  buildWerewolfKillPrompt,
  buildWitchActionPrompt
} from "./prompts";
import type { ModelClient } from "./modelClient";

export interface AgentService {
  speech(game: GameState, agentId: string): Promise<string>;
  vote(game: GameState, agentId: string): Promise<VoteDecision>;
  werewolfKill(game: GameState, agentId: string): Promise<{ targetId?: string }>;
  seerCheck(game: GameState, agentId: string): Promise<{ targetId?: string }>;
  witchAction(game: GameState, agentId: string): Promise<WitchDecision>;
}

function parseJsonObject(raw: string): Record<string, unknown> | undefined {
  try {
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : undefined;
  } catch {
    return undefined;
  }
}

async function completeObject(modelClient: ModelClient, prompt: string): Promise<Record<string, unknown> | undefined> {
  const first = parseJsonObject(await modelClient.completeJson(prompt));

  if (first) {
    return first;
  }

  try {
    return parseJsonObject(await modelClient.completeJson(`${prompt}\n上一次输出不是合法 JSON，请只返回 JSON。`));
  } catch {
    return undefined;
  }
}

function stringField(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export function createAgentService(modelClient: ModelClient): AgentService {
  return {
    async speech(game, agentId) {
      try {
        const result = await completeObject(modelClient, buildSpeechPrompt(game, agentId));
        const speech = stringField(result?.speech);
        return speech ?? fallbackSpeech(game, agentId);
      } catch {
        return fallbackSpeech(game, agentId);
      }
    },

    async vote(game, agentId) {
      try {
        const result = await completeObject(modelClient, buildVotePrompt(game, agentId));
        const targetId = stringField(result?.targetId);

        if (targetId && getVoteCandidates(game, agentId).includes(targetId)) {
          return { targetId };
        }

        return fallbackVote();
      } catch {
        return fallbackVote();
      }
    },

    async werewolfKill(game, agentId) {
      try {
        const result = await completeObject(modelClient, buildWerewolfKillPrompt(game, agentId));
        const targetId = stringField(result?.targetId);

        if (targetId && getWerewolfKillCandidates(game, agentId).includes(targetId)) {
          return { targetId };
        }

        const fallbackTargetId = fallbackWerewolfKill(game, agentId);
        return fallbackTargetId ? { targetId: fallbackTargetId } : {};
      } catch {
        const fallbackTargetId = fallbackWerewolfKill(game, agentId);
        return fallbackTargetId ? { targetId: fallbackTargetId } : {};
      }
    },

    async seerCheck(game, agentId) {
      try {
        const result = await completeObject(modelClient, buildSeerCheckPrompt(game, agentId));
        const targetId = stringField(result?.targetId);

        if (targetId && getSeerCandidates(game, agentId).includes(targetId)) {
          return { targetId };
        }

        const fallbackTargetId = fallbackSeerCheck(game, agentId);
        return fallbackTargetId ? { targetId: fallbackTargetId } : {};
      } catch {
        const fallbackTargetId = fallbackSeerCheck(game, agentId);
        return fallbackTargetId ? { targetId: fallbackTargetId } : {};
      }
    },

    async witchAction(game, agentId) {
      try {
        const result = await completeObject(modelClient, buildWitchActionPrompt(game, agentId));
        const poisonTargetId = stringField(result?.poisonTargetId);
        const useAntidote = result?.useAntidote === true;

        if (poisonTargetId && !getPoisonCandidates(game, agentId).includes(poisonTargetId)) {
          return fallbackWitchAction();
        }

        return {
          useAntidote,
          ...(poisonTargetId ? { poisonTargetId } : {})
        };
      } catch {
        return fallbackWitchAction();
      }
    }
  };
}
