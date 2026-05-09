import type { Team } from "@werewolf/shared";

import { getSeerCandidates, getTeam, getVoteCandidates, getWerewolfKillCandidates, getWinner } from "./rules";
import type { GameState, PlayerState } from "./types";

interface WitchAction {
  useAntidote?: boolean;
  poisonTargetId?: string;
}

function cloneGame(game: GameState): GameState {
  return {
    ...game,
    players: game.players.map((player) => ({ ...player, ...(player.persona ? { persona: { ...player.persona } } : {}) })),
    messages: game.messages.map((message) => ({ ...message })),
    night: {
      ...game.night,
      seerChecks: Object.fromEntries(
        Object.entries(game.night.seerChecks).map(([seerId, checks]) => [seerId, { ...checks }])
      )
    },
    vote: {
      speeches: [...game.vote.speeches],
      votes: { ...game.vote.votes }
    }
  };
}

function findAliveRole(game: GameState, actorId: string, role: PlayerState["role"]): PlayerState {
  const actor = game.players.find((player) => player.id === actorId);

  if (!actor || actor.status !== "alive" || actor.role !== role) {
    throw new Error("非法行动者");
  }

  return actor;
}

function findAliveTarget(game: GameState, targetId: string): PlayerState {
  const target = game.players.find((player) => player.id === targetId);

  if (!target || target.status !== "alive") {
    throw new Error("非法目标");
  }

  return target;
}

function applyWinner(game: GameState): GameState {
  const winner = getWinner(game);

  if (!winner) {
    return game;
  }

  return {
    ...game,
    phase: "game_over",
    winner
  };
}

export function submitWerewolfKill(game: GameState, actorId: string, targetId: string): GameState {
  if (game.phase !== "night_werewolf") {
    throw new Error("当前不是狼人行动阶段");
  }

  findAliveRole(game, actorId, "werewolf");
  findAliveTarget(game, targetId);

  if (!getWerewolfKillCandidates(game, actorId).includes(targetId)) {
    throw new Error("狼人目标非法");
  }

  const next = cloneGame(game);
  next.night.werewolfTargetId = targetId;
  next.phase = "night_seer";
  return next;
}

export function submitSeerCheck(game: GameState, actorId: string, targetId: string): GameState {
  if (game.phase !== "night_seer") {
    throw new Error("当前不是预言家行动阶段");
  }

  findAliveRole(game, actorId, "seer");
  const target = findAliveTarget(game, targetId);
  const next = cloneGame(game);
  const checks = next.night.seerChecks[actorId] ?? {};
  checks[targetId] = getTeam(target.role);
  next.night.seerChecks[actorId] = checks;
  next.phase = "night_witch";
  return next;
}

export function submitWitchAction(game: GameState, actorId: string, action: WitchAction): GameState {
  if (game.phase !== "night_witch") {
    throw new Error("当前不是女巫行动阶段");
  }

  findAliveRole(game, actorId, "witch");
  const next = cloneGame(game);

  if (action.useAntidote && next.night.witchHasAntidote && next.night.werewolfTargetId) {
    next.night.witchSavedTonight = true;
    next.night.witchHasAntidote = false;
  }

  if (action.poisonTargetId && next.night.witchHasPoison) {
    findAliveTarget(next, action.poisonTargetId);
    next.night.witchPoisonTargetId = action.poisonTargetId;
    next.night.witchHasPoison = false;
  }

  return next;
}

export function advanceAfterNight(game: GameState): GameState {
  if (game.phase !== "night_witch") {
    throw new Error("当前不能结算夜晚");
  }

  const next = cloneGame(game);
  const deathIds = new Set<string>();

  if (next.night.werewolfTargetId && !next.night.witchSavedTonight) {
    deathIds.add(next.night.werewolfTargetId);
  }

  if (next.night.witchPoisonTargetId) {
    deathIds.add(next.night.witchPoisonTargetId);
  }

  for (const player of next.players) {
    if (deathIds.has(player.id)) {
      player.status = "dead";
    }
  }

  next.messages.push({
    id: `m${next.messages.length + 1}`,
    round: next.round,
    phase: "day_announcement",
    type: deathIds.size > 0 ? "death" : "system",
    content: deathIds.size > 0 ? `昨夜死亡：${[...deathIds].join("、")}` : "昨夜平安夜。"
  });

  next.phase = "day_announcement";
  return applyWinner(next);
}

export function submitSpeech(game: GameState, playerId: string, content: string): GameState {
  if (game.phase !== "day_speech") {
    throw new Error("当前不是发言阶段");
  }

  findAliveTarget(game, playerId);
  const trimmed = content.trim();

  if (!trimmed) {
    throw new Error("发言不能为空");
  }

  const next = cloneGame(game);
  next.vote.speeches.push(playerId);
  next.messages.push({
    id: `m${next.messages.length + 1}`,
    round: next.round,
    phase: "day_speech",
    type: "speech",
    speakerId: playerId,
    content: trimmed
  });
  return next;
}

export function submitVote(game: GameState, voterId: string, targetId?: string): GameState {
  if (game.phase !== "day_vote") {
    throw new Error("当前不是投票阶段");
  }

  findAliveTarget(game, voterId);

  if (targetId && !getVoteCandidates(game, voterId).includes(targetId)) {
    throw new Error("投票目标非法");
  }

  const next = cloneGame(game);
  next.vote.votes[voterId] = targetId;
  return next;
}

function getExileTarget(votes: Record<string, string | undefined>): string | undefined {
  const counts = new Map<string, number>();

  for (const targetId of Object.values(votes)) {
    if (!targetId) continue;
    counts.set(targetId, (counts.get(targetId) ?? 0) + 1);
  }

  let highest = 0;
  let targetIds: string[] = [];

  for (const [targetId, count] of counts) {
    if (count > highest) {
      highest = count;
      targetIds = [targetId];
    } else if (count === highest) {
      targetIds.push(targetId);
    }
  }

  return targetIds.length === 1 ? targetIds[0] : undefined;
}

export function resolveVotes(game: GameState): GameState {
  if (game.phase !== "day_vote") {
    throw new Error("当前不能结算投票");
  }

  const next = cloneGame(game);
  const exileTargetId = getExileTarget(next.vote.votes);

  if (exileTargetId) {
    const target = next.players.find((player) => player.id === exileTargetId);
    if (target) {
      target.status = "dead";
    }
    next.messages.push({
      id: `m${next.messages.length + 1}`,
      round: next.round,
      phase: "exile_result",
      type: "result",
      content: `投票结束，${exileTargetId} 被放逐。`
    });
  } else {
    next.messages.push({
      id: `m${next.messages.length + 1}`,
      round: next.round,
      phase: "exile_result",
      type: "result",
      content: "投票平票，无人出局。"
    });
  }

  next.phase = "exile_result";
  return applyWinner(next);
}

export function advanceToNextNight(game: GameState): GameState {
  if (game.phase !== "exile_result" && game.phase !== "day_announcement") {
    throw new Error("当前不能进入下一晚");
  }

  const next = cloneGame(game);
  next.round += 1;
  next.phase = "night_werewolf";
  next.night = {
    seerChecks: next.night.seerChecks,
    witchHasAntidote: next.night.witchHasAntidote,
    witchHasPoison: next.night.witchHasPoison,
    witchSavedTonight: false
  };
  next.vote = {
    speeches: [],
    votes: {}
  };
  return next;
}
