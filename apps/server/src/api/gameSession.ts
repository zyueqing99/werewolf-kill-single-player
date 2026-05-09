import { createAgentService, type AgentService } from "../agents/agentService";
import { createModelClientFromEnv } from "../agents/modelClient";
import { createGame } from "../game/createGame";
import {
  advanceAfterNight,
  advanceToDaySpeech,
  advanceToDayVote,
  advanceToNextNight,
  resolveVotes,
  submitSeerCheck,
  submitSpeech,
  submitVote,
  submitWerewolfKill,
  submitWitchAction
} from "../game/reducer";
import type { GameState } from "../game/types";
import { toHumanVisibleState } from "../game/visibleState";
import type { NightActionRequest, SpeechRequest, VisibleGameState, VoteRequest } from "@werewolf/shared";

export class GameSession {
  private game?: GameState;
  private readonly agentService: AgentService;

  constructor(agentService: AgentService = createAgentService(createModelClientFromEnv())) {
    this.agentService = agentService;
  }

  start(): VisibleGameState {
    this.game = createGame();
    return toHumanVisibleState(this.game);
  }

  state(): VisibleGameState {
    return toHumanVisibleState(this.requireGame());
  }

  async next(): Promise<VisibleGameState> {
    this.game = await this.autoAdvance(this.requireGame());
    return toHumanVisibleState(this.game);
  }

  async submitSpeech(request: SpeechRequest): Promise<VisibleGameState> {
    let game = this.requireGame();
    game = submitSpeech(game, request.playerId, request.content);
    this.game = await this.autoAdvance(game);
    return toHumanVisibleState(this.game);
  }

  async submitVote(request: VoteRequest): Promise<VisibleGameState> {
    let game = this.requireGame();
    game = submitVote(game, request.voterId, request.targetId);
    this.game = await this.autoAdvance(game);
    return toHumanVisibleState(this.game);
  }

  async submitNightAction(request: NightActionRequest): Promise<VisibleGameState> {
    let game = this.requireGame();
    const actor = game.players.find((player) => player.id === request.actorId);

    if (!actor) {
      throw new Error("行动者不存在");
    }

    if (game.phase === "night_werewolf") {
      if (!request.targetId) throw new Error("缺少狼人击杀目标");
      game = submitWerewolfKill(game, request.actorId, request.targetId);
    } else if (game.phase === "night_seer") {
      if (!request.targetId) throw new Error("缺少预言家查验目标");
      game = submitSeerCheck(game, request.actorId, request.targetId);
    } else if (game.phase === "night_witch") {
      game = submitWitchAction(game, request.actorId, {
        ...(request.useAntidote === undefined ? {} : { useAntidote: request.useAntidote }),
        ...(request.poisonTargetId ? { poisonTargetId: request.poisonTargetId } : {})
      });
      game = advanceAfterNight(game);
    } else {
      throw new Error("当前阶段不接受夜间行动");
    }

    this.game = await this.autoAdvance(game);
    return toHumanVisibleState(this.game);
  }

  private requireGame(): GameState {
    if (!this.game) {
      throw new Error("游戏尚未开始");
    }

    return this.game;
  }

  private async autoAdvance(game: GameState): Promise<GameState> {
    let current = game;
    let guard = 0;

    while (guard < 50) {
      guard += 1;

      if (current.phase === "game_over") return current;

      const human = current.players.find((player) => player.id === current.humanPlayerId);
      if (!human) throw new Error("缺少真人玩家");

      if (current.phase === "night_werewolf") {
        if (human.role === "werewolf" && human.status === "alive") return current;
        const wolf = current.players.find((player) => player.kind === "agent" && player.role === "werewolf" && player.status === "alive");
        if (!wolf) return current;
        const decision = await this.agentService.werewolfKill(current, wolf.id);
        if (!decision.targetId) return current;
        current = submitWerewolfKill(current, wolf.id, decision.targetId);
        continue;
      }

      if (current.phase === "night_seer") {
        if (human.role === "seer" && human.status === "alive") return current;
        const seer = current.players.find((player) => player.kind === "agent" && player.role === "seer" && player.status === "alive");
        if (!seer) {
          current = { ...current, phase: "night_witch" };
          continue;
        }
        const decision = await this.agentService.seerCheck(current, seer.id);
        if (!decision.targetId) {
          current = { ...current, phase: "night_witch" };
          continue;
        }
        current = submitSeerCheck(current, seer.id, decision.targetId);
        continue;
      }

      if (current.phase === "night_witch") {
        if (human.role === "witch" && human.status === "alive") return current;
        const witch = current.players.find((player) => player.kind === "agent" && player.role === "witch" && player.status === "alive");
        if (witch) {
          const decision = await this.agentService.witchAction(current, witch.id);
          current = submitWitchAction(current, witch.id, decision);
        }
        current = advanceAfterNight(current);
        continue;
      }

      if (current.phase === "day_announcement") {
        current = advanceToDaySpeech(current);
        continue;
      }

      if (current.phase === "day_speech") {
        if (human.status === "alive" && !current.vote.speeches.includes(human.id)) return current;
        const nextAgent = current.players.find(
          (player) => player.kind === "agent" && player.status === "alive" && !current.vote.speeches.includes(player.id)
        );
        if (!nextAgent) {
          current = advanceToDayVote(current);
          continue;
        }
        const speech = await this.agentService.speech(current, nextAgent.id);
        current = submitSpeech(current, nextAgent.id, speech);
        continue;
      }

      if (current.phase === "day_vote") {
        if (human.status === "alive" && !(human.id in current.vote.votes)) return current;
        const nextAgent = current.players.find(
          (player) => player.kind === "agent" && player.status === "alive" && !(player.id in current.vote.votes)
        );
        if (!nextAgent) {
          current = resolveVotes(current);
          continue;
        }
        const decision = await this.agentService.vote(current, nextAgent.id);
        current = submitVote(current, nextAgent.id, decision.targetId);
        continue;
      }

      if (current.phase === "exile_result") {
        current = advanceToNextNight(current);
        continue;
      }

      return current;
    }

    throw new Error("自动推进超过上限");
  }
}
