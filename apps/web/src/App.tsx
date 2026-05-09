import { useMemo, useState } from "react";
import type { VisibleGameState } from "@werewolf/shared";

import { requestNext, startGame, submitNightAction, submitSpeech, submitVote } from "./api";
import { ActionPanel } from "./components/ActionPanel";
import { ChatLog } from "./components/ChatLog";
import { IdentityPanel } from "./components/IdentityPanel";
import { PlayerList } from "./components/PlayerList";

export function App() {
  const [state, setState] = useState<VisibleGameState | undefined>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const playerNameById = useMemo(
    () => new Map(state?.players.map((player) => [player.id, player.name]) ?? []),
    [state?.players]
  );

  async function run(action: () => Promise<VisibleGameState>) {
    setBusy(true);
    setError(undefined);
    try {
      setState(await action());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "操作失败");
    } finally {
      setBusy(false);
    }
  }

  if (!state) {
    return (
      <div className="start-screen">
        <section className="panel start-panel">
          <h1>单机狼人杀</h1>
          <p>6 人局：你和 5 名 AI agent 完成一局狼人杀。</p>
          <button disabled={busy} onClick={() => void run(startGame)}>
            开始游戏
          </button>
          {error ? <p className="error">{error}</p> : null}
        </section>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <PlayerList humanPlayerId={state.humanPlayerId} players={state.players} />
      <ChatLog messages={state.messages} playerNameById={playerNameById} />
      <div className="side-stack">
        <IdentityPanel state={state} />
        <ActionPanel
          busy={busy}
          state={state}
          onNewGame={() => run(startGame)}
          onNext={() => run(requestNext)}
          onSpeech={(content) => run(() => submitSpeech(state.humanPlayerId, content))}
          onVote={(targetId) => run(() => submitVote(state.humanPlayerId, targetId))}
          onNightAction={(request) => run(() => submitNightAction(request))}
        />
        {error ? <p className="error">{error}</p> : null}
      </div>
    </div>
  );
}
