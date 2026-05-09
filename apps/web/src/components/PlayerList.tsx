import type { PlayerPublic } from "@werewolf/shared";

interface PlayerListProps {
  players: PlayerPublic[];
  humanPlayerId: string;
}

export function PlayerList({ players, humanPlayerId }: PlayerListProps) {
  return (
    <aside className="panel player-panel">
      <h2>玩家</h2>
      <div className="player-list">
        {players.map((player) => (
          <div className={`player-row ${player.status}`} key={player.id}>
            <div>
              <strong>{player.name}</strong>
              {player.id === humanPlayerId ? <span className="tag">你</span> : null}
            </div>
            <span>{player.status === "alive" ? "存活" : `出局 ${player.revealedRole ?? ""}`}</span>
          </div>
        ))}
      </div>
    </aside>
  );
}
