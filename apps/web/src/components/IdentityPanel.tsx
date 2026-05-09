import type { VisibleGameState } from "@werewolf/shared";

const roleNames: Record<string, string> = {
  werewolf: "狼人",
  seer: "预言家",
  witch: "女巫",
  villager: "村民"
};

export function IdentityPanel({ state }: { state: VisibleGameState }) {
  return (
    <section className="panel identity-panel">
      <h2>身份</h2>
      <div className="identity-role">{roleNames[state.human.role]}</div>
      {state.human.werewolfAllyIds.length > 0 ? <p>狼队友：{state.human.werewolfAllyIds.join("、")}</p> : null}
      {state.human.role === "seer" ? <p>查验记录：{JSON.stringify(state.human.seerChecks)}</p> : null}
      {state.human.role === "witch" ? (
        <p>
          解药：{state.human.witchHasAntidote ? "可用" : "已用"} / 毒药：
          {state.human.witchHasPoison ? "可用" : "已用"}
        </p>
      ) : null}
    </section>
  );
}
