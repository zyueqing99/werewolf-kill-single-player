import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { VisibleGameState } from "@werewolf/shared";

import { ActionPanel } from "./ActionPanel";

const gameOverState: VisibleGameState = {
  gameId: "game-1",
  round: 1,
  phase: "game_over",
  players: [],
  messages: [],
  humanPlayerId: "p1",
  human: {
    role: "villager",
    werewolfAllyIds: [],
    seerChecks: {},
    witchHasAntidote: false,
    witchHasPoison: false
  },
  currentAction: { type: "none" },
  winner: "villagers"
};

describe("ActionPanel", () => {
  it("游戏结束时显示可点击的重新开局按钮", () => {
    const html = renderToStaticMarkup(
      <ActionPanel
        busy={false}
        state={gameOverState}
        onNewGame={async () => undefined}
        onNext={async () => undefined}
        onNightAction={async () => undefined}
        onSpeech={async () => undefined}
        onVote={async () => undefined}
      />
    );

    expect(html).toContain("重新开局");
    expect(html).not.toContain("disabled");
  });
});
