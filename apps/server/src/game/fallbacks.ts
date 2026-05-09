import type { GameState } from "./types";
import { getPoisonCandidates, getSeerCandidates, getVoteCandidates, getWerewolfKillCandidates } from "./rules";

export interface VoteDecision {
  targetId?: string;
}

export interface WitchDecision {
  useAntidote: boolean;
  poisonTargetId?: string;
}

const FALLBACK_SPEECHES = [
  "我先说下观察：现在不要只看死亡结果，投票时谁在跟风也很重要。",
  "我倾向先盘发言逻辑，发言太空或者急着带票的人需要重点看。",
  "目前信息还少，但我会优先怀疑白天发言回避身份和投票理由的人。",
  "如果有预言家信息建议明确报出来，不然今天容易被狼人带节奏。",
  "我不建议乱票，先找发言里前后矛盾的人。"
];

function stableIndex(seed: string, modulo: number): number {
  let hash = 0;
  for (const char of seed) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return modulo === 0 ? 0 : hash % modulo;
}

export function fallbackSpeech(game?: GameState, actorId = "agent"): string {
  if (!game) {
    return FALLBACK_SPEECHES[0] as string;
  }

  return FALLBACK_SPEECHES[stableIndex(`${actorId}:${game.round}:${game.messages.length}`, FALLBACK_SPEECHES.length)] as string;
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

  const candidates = getVoteCandidates(game, voterId);
  const targetId = candidates[stableIndex(`${voterId}:${game.round}:${game.messages.length}`, candidates.length)];
  return targetId ? { targetId } : {};
}

export function fallbackPoison(game: GameState, actorId: string): string | undefined {
  return getPoisonCandidates(game, actorId)[0];
}
