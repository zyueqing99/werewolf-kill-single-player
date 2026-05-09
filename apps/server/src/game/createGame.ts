import type { PublicMessage, Role } from "@werewolf/shared";

import type { GameState, PlayerState } from "./types";

interface CreateGameOptions {
  humanPlayerId?: string;
  rng?: () => number;
}

const PLAYER_NAMES = ["你", "林夕", "周野", "沈舟", "许宁", "顾白"] as const;
const ROLES: Role[] = ["werewolf", "werewolf", "seer", "witch", "villager", "villager"];

function shuffle<T>(items: T[], rng: () => number): T[] {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex] as T, copy[index] as T];
  }

  return copy;
}

export function createGame(options: CreateGameOptions = {}): GameState {
  const rng = options.rng ?? Math.random;
  const humanPlayerId = options.humanPlayerId ?? "p1";
  const roles = shuffle(ROLES, rng);

  const players: PlayerState[] = PLAYER_NAMES.map((name, index) => {
    const id = `p${index + 1}`;
    const kind = id === humanPlayerId ? "human" : "agent";

    return {
      id,
      name,
      kind,
      status: "alive",
      role: roles[index] as Role,
      ...(kind === "agent"
        ? {
            persona: {
              tone: ["谨慎", "直接", "爱分析", "观察型", "带节奏型"][index - 1] ?? "平和",
              aggression: index % 3 === 0 ? "high" : index % 2 === 0 ? "medium" : "low"
            }
          }
        : {})
    };
  });

  const message: PublicMessage = {
    id: "m1",
    round: 1,
    phase: "night_werewolf",
    type: "system",
    content: "游戏开始。天黑请闭眼。"
  };

  return {
    id: "game-1",
    round: 1,
    phase: "night_werewolf",
    players,
    humanPlayerId,
    messages: [message],
    night: {
      seerChecks: {},
      witchHasAntidote: true,
      witchHasPoison: true,
      witchSavedTonight: false
    },
    vote: {
      speeches: [],
      votes: {}
    }
  };
}
