export type Role = "werewolf" | "seer" | "witch" | "villager";
export type Team = "werewolves" | "villagers";
export type PlayerKind = "human" | "agent";
export type PlayerStatus = "alive" | "dead";

export type Phase =
  | "not_started"
  | "night_werewolf"
  | "night_seer"
  | "night_witch"
  | "day_announcement"
  | "day_speech"
  | "day_vote"
  | "exile_result"
  | "game_over";

export interface PlayerPublic {
  id: string;
  name: string;
  kind: PlayerKind;
  status: PlayerStatus;
  revealedRole?: Role;
}

export interface PublicMessage {
  id: string;
  round: number;
  phase: Phase;
  type: "system" | "speech" | "vote" | "death" | "result";
  speakerId?: string;
  content: string;
}

export interface HumanAbilityState {
  role: Role;
  werewolfAllyIds: string[];
  seerChecks: Record<string, Team>;
  witchHasAntidote: boolean;
  witchHasPoison: boolean;
  currentVictimId?: string;
}

export type HumanAction =
  | { type: "none" }
  | { type: "speech"; playerId: string }
  | { type: "vote"; voterId: string; candidateIds: string[] }
  | { type: "werewolf_kill"; actorId: string; candidateIds: string[] }
  | { type: "seer_check"; actorId: string; candidateIds: string[] }
  | {
      type: "witch_save_or_poison";
      actorId: string;
      victimId?: string;
      poisonCandidateIds: string[];
    };

export interface VisibleGameState {
  gameId: string;
  round: number;
  phase: Phase;
  players: PlayerPublic[];
  messages: PublicMessage[];
  humanPlayerId: string;
  human: HumanAbilityState;
  currentAction: HumanAction;
  winner?: Team;
}

export interface StartGameResponse {
  state: VisibleGameState;
}

export interface SpeechRequest {
  playerId: string;
  content: string;
}

export interface VoteRequest {
  voterId: string;
  targetId?: string;
}

export interface NightActionRequest {
  actorId: string;
  targetId?: string;
  useAntidote?: boolean;
  poisonTargetId?: string;
}
