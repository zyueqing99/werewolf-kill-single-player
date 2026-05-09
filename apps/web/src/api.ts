import type { NightActionRequest, SpeechRequest, VisibleGameState, VoteRequest } from "@werewolf/shared";

interface StateResponse {
  state: VisibleGameState;
}

async function requestState(path: string, init?: RequestInit): Promise<VisibleGameState> {
  const headers = new Headers(init?.headers);
  if (init?.body) {
    headers.set("content-type", "application/json");
  }

  const response = await fetch(path, {
    headers,
    ...init
  });

  const body = (await response.json()) as StateResponse | { error?: string };

  if (!response.ok) {
    throw new Error("error" in body && body.error ? body.error : "请求失败");
  }

  return (body as StateResponse).state;
}

export function startGame(): Promise<VisibleGameState> {
  return requestState("/api/game/start", { method: "POST" });
}

export function getState(): Promise<VisibleGameState> {
  return requestState("/api/game/state");
}

export function submitSpeech(playerId: string, content: string): Promise<VisibleGameState> {
  const payload: SpeechRequest = { playerId, content };
  return requestState("/api/game/speech", { method: "POST", body: JSON.stringify(payload) });
}

export function submitVote(voterId: string, targetId?: string): Promise<VisibleGameState> {
  const payload: VoteRequest = targetId ? { voterId, targetId } : { voterId };
  return requestState("/api/game/vote", { method: "POST", body: JSON.stringify(payload) });
}

export function submitNightAction(request: NightActionRequest): Promise<VisibleGameState> {
  return requestState("/api/game/night-action", { method: "POST", body: JSON.stringify(request) });
}

export function requestNext(): Promise<VisibleGameState> {
  return requestState("/api/game/next", { method: "POST" });
}
