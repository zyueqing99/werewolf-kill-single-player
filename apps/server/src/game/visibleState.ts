import type { PlayerPublic, Team, VisibleGameState } from "@werewolf/shared";

import { getTeam } from "./rules";
import type { GameState, PlayerState } from "./types";

export interface AgentVisibleState {
  self: {
    id: string;
    name: string;
    role: PlayerState["role"];
    status: PlayerState["status"];
    persona?: PlayerState["persona"];
  };
  round: number;
  phase: GameState["phase"];
  players: PlayerPublic[];
  messages: GameState["messages"];
  private: {
    werewolfAllyIds: string[];
    seerChecks: Record<string, Team>;
    witchHasAntidote: boolean;
    witchHasPoison: boolean;
    currentVictimId?: string;
  };
}

function toPublicPlayer(player: PlayerState): PlayerPublic {
  return {
    id: player.id,
    name: player.name,
    kind: player.kind,
    status: player.status,
    ...(player.status === "dead" ? { revealedRole: player.role } : {})
  };
}

function getWerewolfAllyIds(game: GameState, viewer: PlayerState): string[] {
  if (viewer.role !== "werewolf") {
    return [];
  }

  return game.players
    .filter((player) => player.role === "werewolf" && player.id !== viewer.id)
    .map((player) => player.id);
}

function getCurrentAction(game: GameState): VisibleGameState["currentAction"] {
  const human = game.players.find((player) => player.id === game.humanPlayerId);

  if (!human || human.status === "dead" || game.phase === "game_over") {
    return { type: "none" };
  }

  if (game.phase === "night_werewolf" && human.role === "werewolf") {
    return {
      type: "werewolf_kill",
      actorId: human.id,
      candidateIds: game.players
        .filter((player) => player.status === "alive" && player.role !== "werewolf")
        .map((player) => player.id)
    };
  }

  if (game.phase === "night_seer" && human.role === "seer") {
    return {
      type: "seer_check",
      actorId: human.id,
      candidateIds: game.players
        .filter((player) => player.status === "alive" && player.id !== human.id)
        .map((player) => player.id)
    };
  }

  if (game.phase === "night_witch" && human.role === "witch") {
    return {
      type: "witch_save_or_poison",
      actorId: human.id,
      ...(game.night.werewolfTargetId ? { victimId: game.night.werewolfTargetId } : {}),
      poisonCandidateIds: game.players
        .filter((player) => player.status === "alive" && player.id !== human.id)
        .map((player) => player.id)
    };
  }

  if (game.phase === "day_speech") {
    return { type: "speech", playerId: human.id };
  }

  if (game.phase === "day_vote") {
    return {
      type: "vote",
      voterId: human.id,
      candidateIds: game.players
        .filter((player) => player.status === "alive" && player.id !== human.id)
        .map((player) => player.id)
    };
  }

  return { type: "none" };
}

export function toHumanVisibleState(game: GameState): VisibleGameState {
  const human = game.players.find((player) => player.id === game.humanPlayerId);

  if (!human) {
    throw new Error("缺少真人玩家");
  }

  return {
    gameId: game.id,
    round: game.round,
    phase: game.phase,
    players: game.players.map(toPublicPlayer),
    messages: game.messages,
    humanPlayerId: game.humanPlayerId,
    human: {
      role: human.role,
      werewolfAllyIds: getWerewolfAllyIds(game, human),
      seerChecks: game.night.seerChecks[human.id] ?? {},
      witchHasAntidote: human.role === "witch" && game.night.witchHasAntidote,
      witchHasPoison: human.role === "witch" && game.night.witchHasPoison,
      ...(human.role === "witch" && game.night.werewolfTargetId
        ? { currentVictimId: game.night.werewolfTargetId }
        : {})
    },
    currentAction: getCurrentAction(game),
    ...(game.winner ? { winner: game.winner } : {})
  };
}

export function toAgentVisibleState(game: GameState, agentId: string): AgentVisibleState {
  const self = game.players.find((player) => player.id === agentId);

  if (!self || self.kind !== "agent") {
    throw new Error("缺少 agent 玩家");
  }

  return {
    self: {
      id: self.id,
      name: self.name,
      role: self.role,
      status: self.status,
      ...(self.persona ? { persona: self.persona } : {})
    },
    round: game.round,
    phase: game.phase,
    players: game.players.map(toPublicPlayer),
    messages: game.messages,
    private: {
      werewolfAllyIds: getWerewolfAllyIds(game, self),
      seerChecks: game.night.seerChecks[self.id] ?? {},
      witchHasAntidote: self.role === "witch" && game.night.witchHasAntidote,
      witchHasPoison: self.role === "witch" && game.night.witchHasPoison,
      ...(self.role === "witch" && game.night.werewolfTargetId
        ? { currentVictimId: game.night.werewolfTargetId }
        : {})
    }
  };
}
