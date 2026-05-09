import { useState } from "react";
import type { VisibleGameState } from "@werewolf/shared";

interface ActionPanelProps {
  state: VisibleGameState;
  busy: boolean;
  onSpeech(content: string): Promise<void>;
  onVote(targetId?: string): Promise<void>;
  onNightAction(request: {
    actorId: string;
    targetId?: string;
    useAntidote?: boolean;
    poisonTargetId?: string;
  }): Promise<void>;
  onNext(): Promise<void>;
}

function playerName(state: VisibleGameState, playerId: string): string {
  return state.players.find((player) => player.id === playerId)?.name ?? playerId;
}

export function ActionPanel({ state, busy, onSpeech, onVote, onNightAction, onNext }: ActionPanelProps) {
  const [speech, setSpeech] = useState("");
  const action = state.currentAction;

  return (
    <aside className="panel action-panel">
      <h2>操作</h2>
      <p className="phase">当前阶段：{state.phase}</p>
      {state.winner ? <p className="winner">胜利方：{state.winner === "werewolves" ? "狼人" : "好人"}</p> : null}

      {action.type === "none" ? (
        <button disabled={busy || state.phase === "game_over"} onClick={onNext}>
          继续
        </button>
      ) : null}

      {action.type === "speech" ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void onSpeech(speech).then(() => setSpeech(""));
          }}
        >
          <textarea value={speech} onChange={(event) => setSpeech(event.target.value)} placeholder="输入你的发言" />
          <button disabled={busy || !speech.trim()} type="submit">
            发送
          </button>
        </form>
      ) : null}

      {action.type === "vote" ? (
        <div className="button-list">
          {action.candidateIds.map((id) => (
            <button disabled={busy} key={id} onClick={() => void onVote(id)}>
              投给 {playerName(state, id)}
            </button>
          ))}
          <button disabled={busy} onClick={() => void onVote()}>
            弃票
          </button>
        </div>
      ) : null}

      {action.type === "werewolf_kill" || action.type === "seer_check" ? (
        <div className="button-list">
          {action.candidateIds.map((id) => (
            <button disabled={busy} key={id} onClick={() => void onNightAction({ actorId: action.actorId, targetId: id })}>
              {action.type === "werewolf_kill" ? "击杀" : "查验"} {playerName(state, id)}
            </button>
          ))}
        </div>
      ) : null}

      {action.type === "witch_save_or_poison" ? (
        <div className="button-list">
          {action.victimId ? (
            <button disabled={busy || !state.human.witchHasAntidote} onClick={() => void onNightAction({ actorId: action.actorId, useAntidote: true })}>
              使用解药救 {playerName(state, action.victimId)}
            </button>
          ) : null}
          {action.poisonCandidateIds.map((id) => (
            <button disabled={busy || !state.human.witchHasPoison} key={id} onClick={() => void onNightAction({ actorId: action.actorId, poisonTargetId: id })}>
              毒杀 {playerName(state, id)}
            </button>
          ))}
          <button disabled={busy} onClick={() => void onNightAction({ actorId: action.actorId })}>
            不用药
          </button>
        </div>
      ) : null}
    </aside>
  );
}
