import type { Phase, PlayerKind, PlayerStatus, PublicMessage, Role, Team } from "@werewolf/shared";

export interface AgentPersona {
  tone: string;
  aggression: "low" | "medium" | "high";
}

export interface PlayerState {
  id: string;
  name: string;
  kind: PlayerKind;
  status: PlayerStatus;
  role: Role;
  persona?: AgentPersona;
}

export interface NightState {
  werewolfTargetId?: string;
  seerChecks: Record<string, Record<string, Team>>;
  witchHasAntidote: boolean;
  witchHasPoison: boolean;
  witchSavedTonight: boolean;
  witchPoisonTargetId?: string;
}

export interface VoteState {
  speeches: string[];
  votes: Record<string, string | undefined>;
}

export interface GameState {
  id: string;
  round: number;
  phase: Phase;
  players: PlayerState[];
  humanPlayerId: string;
  messages: PublicMessage[];
  night: NightState;
  vote: VoteState;
  winner?: Team;
}
