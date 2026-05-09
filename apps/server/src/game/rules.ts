import type { Role, Team } from "@werewolf/shared";

import type { GameState, PlayerState } from "./types";

export function getTeam(role: Role): Team {
  return role === "werewolf" ? "werewolves" : "villagers";
}

export function getAlivePlayers(game: GameState): PlayerState[] {
  return game.players.filter((player) => player.status === "alive");
}

export function getWinner(game: GameState): Team | undefined {
  const alivePlayers = getAlivePlayers(game);
  const aliveWerewolves = alivePlayers.filter((player) => player.role === "werewolf").length;
  const aliveVillagers = alivePlayers.length - aliveWerewolves;

  if (aliveWerewolves === 0) {
    return "villagers";
  }

  if (aliveWerewolves >= aliveVillagers) {
    return "werewolves";
  }

  return undefined;
}

export function getWerewolfKillCandidates(game: GameState, actorId: string): string[] {
  const actor = game.players.find((player) => player.id === actorId);

  if (!actor || actor.role !== "werewolf" || actor.status !== "alive") {
    return [];
  }

  return getAlivePlayers(game)
    .filter((player) => player.role !== "werewolf")
    .map((player) => player.id);
}

export function getSeerCandidates(game: GameState, actorId: string): string[] {
  const actor = game.players.find((player) => player.id === actorId);
  const checked = game.night.seerChecks[actorId] ?? {};

  if (!actor || actor.role !== "seer" || actor.status !== "alive") {
    return [];
  }

  return getAlivePlayers(game)
    .filter((player) => player.id !== actorId && checked[player.id] === undefined)
    .map((player) => player.id);
}

export function getPoisonCandidates(game: GameState, actorId: string): string[] {
  const actor = game.players.find((player) => player.id === actorId);

  if (!actor || actor.role !== "witch" || actor.status !== "alive" || !game.night.witchHasPoison) {
    return [];
  }

  return getAlivePlayers(game)
    .filter((player) => player.id !== actorId)
    .map((player) => player.id);
}

export function getVoteCandidates(game: GameState, voterId: string): string[] {
  const voter = game.players.find((player) => player.id === voterId);

  if (!voter || voter.status !== "alive") {
    return [];
  }

  return getAlivePlayers(game)
    .filter((player) => player.id !== voterId)
    .map((player) => player.id);
}
