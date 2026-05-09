import type { GameState } from "../game/types";
import { toAgentVisibleState } from "../game/visibleState";

function publicContext(game: GameState, agentId: string): string {
  const view = toAgentVisibleState(game, agentId);
  const publicPlayers = view.players.map((player) => ({
    id: player.id,
    name: player.name,
    status: player.status,
    revealedRole: player.revealedRole
  }));

  const privateLines: string[] = [`你的身份：${view.self.role}`];

  if (view.self.role === "werewolf") {
    privateLines.push(`狼队友 ID：${view.private.werewolfAllyIds.join("、") || "无"}`);
  }

  if (view.self.role === "seer") {
    privateLines.push(`你的查验结果：${JSON.stringify(view.private.seerChecks)}`);
  }

  if (view.self.role === "witch") {
    privateLines.push(`解药可用：${view.private.witchHasAntidote ? "是" : "否"}`);
    privateLines.push(`毒药可用：${view.private.witchHasPoison ? "是" : "否"}`);
    if (view.private.currentVictimId) {
      privateLines.push(`今晚被杀目标：${view.private.currentVictimId}`);
    }
  }

  return [
    "你正在玩 6 人狼人杀。只能根据以下信息行动，不要假装知道未给出的隐藏身份。",
    `你是：${view.self.name}（${view.self.id}）`,
    `当前轮次：${view.round}`,
    `当前阶段：${view.phase}`,
    `公开玩家：${JSON.stringify(publicPlayers)}`,
    `公开消息：${JSON.stringify(view.messages)}`,
    `私有信息：${privateLines.join("；")}`
  ].join("\n");
}

export function buildSpeechPrompt(game: GameState, agentId: string): string {
  return [
    publicContext(game, agentId),
    "请生成你的白天发言。",
    "只返回 JSON：{\"speech\":\"你的发言\"}。"
  ].join("\n");
}

export function buildVotePrompt(game: GameState, agentId: string): string {
  return [
    publicContext(game, agentId),
    "请决定投票目标，也可以弃票。",
    "只返回 JSON：{\"targetId\":\"玩家 ID\"} 或 {\"targetId\":null}。"
  ].join("\n");
}

export function buildWerewolfKillPrompt(game: GameState, agentId: string): string {
  return [
    publicContext(game, agentId),
    "你是狼人，请选择今晚击杀目标。",
    "只返回 JSON：{\"targetId\":\"玩家 ID\"}。"
  ].join("\n");
}

export function buildSeerCheckPrompt(game: GameState, agentId: string): string {
  return [
    publicContext(game, agentId),
    "你是预言家，请选择今晚查验目标。",
    "只返回 JSON：{\"targetId\":\"玩家 ID\"}。"
  ].join("\n");
}

export function buildWitchActionPrompt(game: GameState, agentId: string): string {
  return [
    publicContext(game, agentId),
    "你是女巫，请决定是否使用解药或毒药。",
    "只返回 JSON：{\"useAntidote\":false,\"poisonTargetId\":null}。"
  ].join("\n");
}
