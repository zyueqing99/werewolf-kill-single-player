import type { GameState } from "./types";
import { getPoisonCandidates, getSeerCandidates, getVoteCandidates, getWerewolfKillCandidates } from "./rules";

export interface VoteDecision {
  targetId?: string;
}

export interface WitchDecision {
  useAntidote: boolean;
  poisonTargetId?: string;
}

export function fallbackSpeech(): string {
  return "我先听听大家怎么说。";
}

export function fallbackWerewolfKill(game: GameState, actorId: string): string | undefined {
  return getWerewolfKillCandidates(game, actorId)[0];
}

export function fallbackSeerCheck(game: GameState, actorId: string): string | undefined {
  return getSeerCandidates(game, actorId)[0];
}

export function fallbackWitchAction(): WitchDecision {
  return { useAntidote: false };
}

export function fallbackVote(game?: GameState, voterId?: string): VoteDecision {
  if (!game || !voterId) {
    return {};
  }

  const targetId = getVoteCandidates(game, voterId)[0];
  return targetId ? { targetId } : {};
}

export function fallbackPoison(game: GameState, actorId: string): string | undefined {
  return getPoisonCandidates(game, actorId)[0];
}
