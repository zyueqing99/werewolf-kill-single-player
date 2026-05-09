# Werewolf 6-Player MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local browser-based 6-player single-player Werewolf game where one human player joins five AI agents and can complete a full match.

**Architecture:** Use a TypeScript monorepo with shared domain types, a pure backend game engine, an OpenAI-compatible agent adapter, HTTP JSON API routes, and a React/Vite frontend. The backend remains the authoritative state source and only returns the human player's visible state.

**Tech Stack:** TypeScript, pnpm workspaces, Node.js, Fastify, Vitest, React, Vite, CSS modules or plain CSS, OpenAI-compatible chat completions API.

---

## File Structure

Create a small workspace with focused packages:

- `package.json`: root workspace scripts.
- `pnpm-workspace.yaml`: workspace package list.
- `tsconfig.base.json`: shared TypeScript compiler settings.
- `.gitignore`: ignores dependencies, build output, environment files, and logs.
- `.env.example`: documents model configuration.
- `packages/shared/src/types.ts`: shared role, player, phase, message, action, and visible-state types.
- `packages/shared/src/index.ts`: shared exports.
- `packages/shared/package.json`: shared package metadata.
- `apps/server/src/game/rules.ts`: constants and pure rule helpers.
- `apps/server/src/game/createGame.ts`: game creation, player creation, random role assignment.
- `apps/server/src/game/visibleState.ts`: frontend and agent view projection.
- `apps/server/src/game/reducer.ts`: state transitions and validation.
- `apps/server/src/game/fallbacks.ts`: deterministic fallback decisions for failed agent outputs.
- `apps/server/src/agents/modelClient.ts`: OpenAI-compatible HTTP client.
- `apps/server/src/agents/prompts.ts`: prompt builders using only allowed visible state.
- `apps/server/src/agents/agentService.ts`: JSON parsing, retry, and fallback orchestration.
- `apps/server/src/api/server.ts`: Fastify app and HTTP routes.
- `apps/server/src/index.ts`: server entry point.
- `apps/server/test/game/*.test.ts`: game engine tests.
- `apps/server/test/agents/*.test.ts`: prompt, parser, and fallback tests.
- `apps/server/package.json`: server scripts and dependencies.
- `apps/server/tsconfig.json`: server TypeScript config.
- `apps/server/vitest.config.ts`: server test config.
- `apps/web/src/api.ts`: HTTP API client.
- `apps/web/src/App.tsx`: main game UI.
- `apps/web/src/components/*.tsx`: player list, chat log, action panel, identity panel.
- `apps/web/src/styles.css`: MVP layout and visual styling.
- `apps/web/src/main.tsx`: React entry point.
- `apps/web/package.json`: frontend scripts and dependencies.
- `apps/web/tsconfig.json`: frontend TypeScript config.
- `apps/web/vite.config.ts`: Vite config with `/api` proxy.

---

### Task 1: Scaffold Workspace

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `tsconfig.base.json`
- Create: `.gitignore`
- Create: `.env.example`
- Modify: `README.md`

- [ ] **Step 1: Create root package metadata**

Create `package.json` with workspace scripts:

```json
{
  "name": "werewolf-kill-single-player",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "pnpm --parallel dev",
    "dev:server": "pnpm --filter @werewolf/server dev",
    "dev:web": "pnpm --filter @werewolf/web dev",
    "build": "pnpm -r build",
    "test": "pnpm -r test",
    "typecheck": "pnpm -r typecheck"
  },
  "packageManager": "pnpm@9.15.0"
}
```

- [ ] **Step 2: Create workspace and TypeScript config**

Create `pnpm-workspace.yaml`:

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

Create `tsconfig.base.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true
  }
}
```

- [ ] **Step 3: Add environment and ignore files**

Create `.gitignore`:

```gitignore
node_modules
dist
coverage
.env
.env.local
*.log
.DS_Store
```

Create `.env.example`:

```bash
PORT=8787
OPENAI_COMPAT_BASE_URL=https://api.openai.com/v1
OPENAI_COMPAT_API_KEY=replace-me
OPENAI_COMPAT_MODEL=gpt-4o-mini
```

- [ ] **Step 4: Update README with local setup**

Replace `README.md` with:

```markdown
# werewolf-kill-single-player

单机版狼人杀 MVP：1 名真人玩家 + 5 名 AI agent，在本地浏览器中完成 6 人局。

## 开发

```bash
pnpm install
cp .env.example .env
pnpm dev
```

前端默认运行在 Vite 端口，后端默认运行在 `http://localhost:8787`。
```

- [ ] **Step 5: Install dependencies**

Run:

```bash
pnpm install
```

Expected: lockfile is created and install completes successfully.

- [ ] **Step 6: Commit scaffold**

Run:

```bash
git add package.json pnpm-workspace.yaml tsconfig.base.json .gitignore .env.example README.md pnpm-lock.yaml
git commit -m "chore: scaffold TypeScript workspace"
```

---

### Task 2: Add Shared Domain Types

**Files:**
- Create: `packages/shared/package.json`
- Create: `packages/shared/src/types.ts`
- Create: `packages/shared/src/index.ts`
- Create: `packages/shared/tsconfig.json`

- [ ] **Step 1: Create shared package metadata**

Create `packages/shared/package.json`:

```json
{
  "name": "@werewolf/shared",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "test": "echo \"shared: no tests yet\""
  },
  "devDependencies": {
    "typescript": "^5.8.3"
  }
}
```

- [ ] **Step 2: Define shared types**

Create `packages/shared/src/types.ts` with these exported types:

```ts
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
  | { type: "witch_save_or_poison"; actorId: string; victimId?: string; poisonCandidateIds: string[] };

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
```

- [ ] **Step 3: Export shared module**

Create `packages/shared/src/index.ts`:

```ts
export * from "./types";
```

- [ ] **Step 4: Add shared TypeScript config**

Create `packages/shared/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "declaration": true
  },
  "include": ["src"]
}
```

- [ ] **Step 5: Verify shared package**

Run:

```bash
pnpm --filter @werewolf/shared typecheck
pnpm --filter @werewolf/shared build
```

Expected: both commands pass.

- [ ] **Step 6: Commit shared types**

Run:

```bash
git add packages/shared
git commit -m "feat(shared): add game domain types"
```

---

### Task 3: Implement Game Creation and Visibility Rules

**Files:**
- Create: `apps/server/package.json`
- Create: `apps/server/tsconfig.json`
- Create: `apps/server/vitest.config.ts`
- Create: `apps/server/src/game/types.ts`
- Create: `apps/server/src/game/rules.ts`
- Create: `apps/server/src/game/createGame.ts`
- Create: `apps/server/src/game/visibleState.ts`
- Create: `apps/server/test/game/createGame.test.ts`
- Create: `apps/server/test/game/visibleState.test.ts`

- [ ] **Step 1: Create server package**

Create `apps/server/package.json` with Fastify and Vitest dependencies:

```json
{
  "name": "@werewolf/server",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc -p tsconfig.json",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "@werewolf/shared": "workspace:*",
    "fastify": "^5.3.3",
    "nanoid": "^5.1.5"
  },
  "devDependencies": {
    "@types/node": "^22.15.3",
    "tsx": "^4.19.4",
    "typescript": "^5.8.3",
    "vitest": "^3.1.2"
  }
}
```

Create `apps/server/tsconfig.json` and `apps/server/vitest.config.ts` using the root config and Node test environment.

- [ ] **Step 2: Write creation tests first**

Create tests that verify:

- A new game has exactly six players.
- Role counts are 2 werewolves, 1 seer, 1 witch, 2 villagers.
- Exactly one player has `kind: "human"`.
- The initial phase is `night_werewolf`.

Run:

```bash
pnpm --filter @werewolf/server test apps/server/test/game/createGame.test.ts
```

Expected: FAIL because implementation files do not exist.

- [ ] **Step 3: Implement internal game types and creation**

Define internal `GameState`, `PlayerState`, `NightState`, `VoteState`, and `AgentPersona` in `apps/server/src/game/types.ts`.

Implement `createGame({ humanPlayerId?, rng? })` in `apps/server/src/game/createGame.ts`:

- Create six players named `你`, `林夕`, `周野`, `沈舟`, `许宁`, `顾白`.
- Assign one human and five agents.
- Shuffle the fixed role list.
- Start at round 1 and phase `night_werewolf`.
- Initialize witch antidote and poison as available.
- Add a system message announcing the game start without revealing hidden roles.

- [ ] **Step 4: Run creation tests**

Run:

```bash
pnpm --filter @werewolf/server test apps/server/test/game/createGame.test.ts
```

Expected: PASS.

- [ ] **Step 5: Write visibility tests**

Create tests that verify:

- Human visible state includes the human role.
- A human werewolf sees werewolf ally IDs.
- A human villager does not see any hidden roles.
- Public player list does not reveal living hidden roles.
- Agent visible state for a werewolf includes allies.
- Agent visible state for a villager excludes hidden roles.

Run:

```bash
pnpm --filter @werewolf/server test apps/server/test/game/visibleState.test.ts
```

Expected: FAIL before visibility implementation.

- [ ] **Step 6: Implement visibility projections**

In `visibleState.ts`, implement:

- `toHumanVisibleState(game: GameState): VisibleGameState`
- `toAgentVisibleState(game: GameState, agentId: string)`

Ensure neither function returns complete hidden state. Agent view may be server-only and does not need to match frontend response shape.

- [ ] **Step 7: Run visibility tests**

Run:

```bash
pnpm --filter @werewolf/server test apps/server/test/game/visibleState.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit game creation**

Run:

```bash
git add apps/server packages/shared package.json pnpm-lock.yaml
git commit -m "feat(server): add game creation and visibility rules"
```

---

### Task 4: Implement Core Rule Reducer

**Files:**
- Create: `apps/server/src/game/reducer.ts`
- Create: `apps/server/test/game/night.test.ts`
- Create: `apps/server/test/game/vote.test.ts`
- Create: `apps/server/test/game/winConditions.test.ts`

- [ ] **Step 1: Write night resolution tests**

Create tests for:

- Werewolf kill marks the night victim.
- Seer check records `werewolves` for a werewolf and `villagers` for non-werewolf.
- Witch antidote prevents the night victim from dying and consumes antidote.
- Witch poison kills the selected target and consumes poison.
- Dead players are excluded from future candidate lists.

Run:

```bash
pnpm --filter @werewolf/server test apps/server/test/game/night.test.ts
```

Expected: FAIL.

- [ ] **Step 2: Implement night reducer functions**

In `reducer.ts`, implement pure functions:

- `submitWerewolfKill(game, actorId, targetId)`
- `submitSeerCheck(game, actorId, targetId)`
- `submitWitchAction(game, actorId, action)`
- `advanceAfterNight(game)`

Each function returns a new `GameState` and validates phase, actor role, actor status, and target status.

- [ ] **Step 3: Run night tests**

Run:

```bash
pnpm --filter @werewolf/server test apps/server/test/game/night.test.ts
```

Expected: PASS.

- [ ] **Step 4: Write voting tests**

Create tests for:

- A valid vote is recorded once per alive voter.
- Repeated vote from same player replaces previous vote or is rejected consistently; choose replacement for MVP.
- Highest vote target is exiled.
- Tie for highest votes exiles nobody.
- Exiled player status becomes dead.

Run:

```bash
pnpm --filter @werewolf/server test apps/server/test/game/vote.test.ts
```

Expected: FAIL.

- [ ] **Step 5: Implement voting reducer functions**

In `reducer.ts`, implement:

- `submitSpeech(game, playerId, content)`
- `submitVote(game, voterId, targetId?)`
- `resolveVotes(game)`
- `advanceToNextNight(game)`

Public messages should be appended for human and agent speeches, vote summaries, exile results, and peaceful tie results.

- [ ] **Step 6: Run voting tests**

Run:

```bash
pnpm --filter @werewolf/server test apps/server/test/game/vote.test.ts
```

Expected: PASS.

- [ ] **Step 7: Write win condition tests**

Create tests for:

- Villagers win when all werewolves are dead.
- Werewolves win when alive werewolves are greater than or equal to alive non-werewolves.
- No winner while both teams can continue.
- Win is checked after night deaths and after exile.

Run:

```bash
pnpm --filter @werewolf/server test apps/server/test/game/winConditions.test.ts
```

Expected: FAIL.

- [ ] **Step 8: Implement win condition checks**

In `rules.ts`, implement:

- `getTeam(role: Role): Team`
- `getAlivePlayers(game)`
- `getWinner(game): Team | undefined`
- Candidate helpers for kill, seer, witch poison, and vote actions.

Call `getWinner` from reducer transitions after night resolution and exile resolution.

- [ ] **Step 9: Run reducer test suite**

Run:

```bash
pnpm --filter @werewolf/server test apps/server/test/game
```

Expected: PASS.

- [ ] **Step 10: Commit reducer**

Run:

```bash
git add apps/server/src/game apps/server/test/game
git commit -m "feat(server): implement werewolf rule reducer"
```

---

### Task 5: Implement Agent Adapter and Fallbacks

**Files:**
- Create: `apps/server/src/game/fallbacks.ts`
- Create: `apps/server/src/agents/modelClient.ts`
- Create: `apps/server/src/agents/prompts.ts`
- Create: `apps/server/src/agents/agentService.ts`
- Create: `apps/server/test/agents/fallbacks.test.ts`
- Create: `apps/server/test/agents/prompts.test.ts`
- Create: `apps/server/test/agents/agentService.test.ts`

- [ ] **Step 1: Write fallback tests**

Create tests that verify:

- Speech fallback returns a short non-empty speech.
- Werewolf fallback chooses an alive non-werewolf when possible.
- Seer fallback chooses an alive unchecked target when possible.
- Witch fallback defaults to no antidote and no poison.
- Vote fallback returns no target.

Run:

```bash
pnpm --filter @werewolf/server test apps/server/test/agents/fallbacks.test.ts
```

Expected: FAIL.

- [ ] **Step 2: Implement fallback helpers**

In `fallbacks.ts`, export:

- `fallbackSpeech()`
- `fallbackWerewolfKill(game, actorId)`
- `fallbackSeerCheck(game, actorId)`
- `fallbackWitchAction()`
- `fallbackVote()`

Use existing candidate helpers from `rules.ts`.

- [ ] **Step 3: Run fallback tests**

Run:

```bash
pnpm --filter @werewolf/server test apps/server/test/agents/fallbacks.test.ts
```

Expected: PASS.

- [ ] **Step 4: Write prompt isolation tests**

Create tests that verify:

- A villager prompt does not contain `werewolfAllyIds`.
- A villager prompt does not contain other players' hidden roles.
- A werewolf prompt contains ally IDs.
- The prompt includes public messages and current phase.

Run:

```bash
pnpm --filter @werewolf/server test apps/server/test/agents/prompts.test.ts
```

Expected: FAIL.

- [ ] **Step 5: Implement prompt builders**

In `prompts.ts`, implement prompt builders for:

- speech
- vote
- werewolf kill
- seer check
- witch action

Every prompt must be built from `toAgentVisibleState`, not from raw `GameState` serialization.

- [ ] **Step 6: Implement model client and agent service**

In `modelClient.ts`, implement `createModelClientFromEnv()` and a `completeJson(prompt)` method that calls:

```text
POST {OPENAI_COMPAT_BASE_URL}/chat/completions
```

with `Authorization: Bearer {OPENAI_COMPAT_API_KEY}` and the configured model.

In `agentService.ts`, implement:

- JSON parsing with one retry.
- Shape validation for target IDs.
- Fallback use after invalid JSON, invalid target, or thrown model error.

- [ ] **Step 7: Run agent tests**

Run:

```bash
pnpm --filter @werewolf/server test apps/server/test/agents
```

Expected: PASS with mocked model client.

- [ ] **Step 8: Commit agent layer**

Run:

```bash
git add apps/server/src/agents apps/server/src/game/fallbacks.ts apps/server/test/agents
git commit -m "feat(server): add agent prompts and fallbacks"
```

---

### Task 6: Implement HTTP API and In-Memory Game Session

**Files:**
- Create: `apps/server/src/api/gameSession.ts`
- Create: `apps/server/src/api/server.ts`
- Create: `apps/server/src/index.ts`
- Create: `apps/server/test/api/server.test.ts`

- [ ] **Step 1: Write API tests**

Create tests with Fastify injection for:

- `POST /api/game/start` returns a visible state.
- `POST /api/game/speech` accepts the human speech when current action is speech.
- `POST /api/game/vote` accepts a human vote when current action is vote.
- `POST /api/game/night-action` accepts a valid human night action.
- Responses never include raw hidden role maps or full internal state.

Run:

```bash
pnpm --filter @werewolf/server test apps/server/test/api/server.test.ts
```

Expected: FAIL.

- [ ] **Step 2: Implement session orchestrator**

In `gameSession.ts`, implement an in-memory singleton session that:

- Starts a new game.
- Stores current `GameState`.
- Accepts human actions.
- Automatically advances through AI-only steps by calling `agentService`.
- Stops when the next required action belongs to the human or the game is over.
- Returns `toHumanVisibleState`.

- [ ] **Step 3: Implement Fastify routes**

In `server.ts`, create routes:

- `GET /api/health`
- `POST /api/game/start`
- `GET /api/game/state`
- `POST /api/game/speech`
- `POST /api/game/vote`
- `POST /api/game/night-action`
- `POST /api/game/next`

In `index.ts`, start the server on `PORT || 8787`.

- [ ] **Step 4: Run API tests**

Run:

```bash
pnpm --filter @werewolf/server test apps/server/test/api/server.test.ts
pnpm --filter @werewolf/server typecheck
```

Expected: PASS.

- [ ] **Step 5: Commit API layer**

Run:

```bash
git add apps/server/src/api apps/server/src/index.ts apps/server/test/api
git commit -m "feat(server): expose game HTTP API"
```

---

### Task 7: Build React MVP UI

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/vite.config.ts`
- Create: `apps/web/index.html`
- Create: `apps/web/src/main.tsx`
- Create: `apps/web/src/api.ts`
- Create: `apps/web/src/App.tsx`
- Create: `apps/web/src/components/PlayerList.tsx`
- Create: `apps/web/src/components/ChatLog.tsx`
- Create: `apps/web/src/components/ActionPanel.tsx`
- Create: `apps/web/src/components/IdentityPanel.tsx`
- Create: `apps/web/src/styles.css`

- [ ] **Step 1: Create frontend package**

Create `apps/web/package.json` with React, Vite, and TypeScript scripts:

```json
{
  "name": "@werewolf/web",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite --host 0.0.0.0",
    "build": "tsc -p tsconfig.json && vite build",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "test": "echo \"web: no automated tests yet\""
  },
  "dependencies": {
    "@vitejs/plugin-react": "^4.4.1",
    "@werewolf/shared": "workspace:*",
    "react": "^19.1.0",
    "react-dom": "^19.1.0"
  },
  "devDependencies": {
    "@types/react": "^19.1.2",
    "@types/react-dom": "^19.1.2",
    "typescript": "^5.8.3",
    "vite": "^6.3.4"
  }
}
```

- [ ] **Step 2: Add Vite and React entry files**

Create Vite config with proxy:

```ts
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": "http://localhost:8787"
    }
  }
});
```

Create `index.html`, `src/main.tsx`, and TypeScript config.

- [ ] **Step 3: Implement API client**

In `api.ts`, implement functions:

- `startGame()`
- `getState()`
- `submitSpeech(playerId, content)`
- `submitVote(voterId, targetId?)`
- `submitNightAction(request)`
- `requestNext()`

Each function calls the matching `/api/game/*` endpoint and returns `VisibleGameState`.

- [ ] **Step 4: Implement UI components**

Build a single-screen app with:

- Left player list.
- Center chat log.
- Right action panel.
- Bottom or side identity panel.

The action panel must render controls based on `state.currentAction.type`:

- `none`: show continue button.
- `speech`: textarea and submit button.
- `vote`: candidate buttons and abstain button.
- `werewolf_kill`: target buttons.
- `seer_check`: target buttons.
- `witch_save_or_poison`: antidote and poison controls.

- [ ] **Step 5: Add MVP styling**

Use plain CSS with stable responsive layout:

- Desktop: three-column layout.
- Mobile: stacked layout.
- Chat log scrolls independently.
- Buttons and panels avoid text overflow.
- No decorative landing page.

- [ ] **Step 6: Verify frontend build**

Run:

```bash
pnpm --filter @werewolf/web typecheck
pnpm --filter @werewolf/web build
```

Expected: PASS.

- [ ] **Step 7: Commit frontend**

Run:

```bash
git add apps/web
git commit -m "feat(web): add playable game interface"
```

---

### Task 8: End-to-End Local Verification

**Files:**
- Modify: `README.md`
- Modify: only the implementation files that fail the checks in this task, keeping fixes scoped to the failing behavior

- [ ] **Step 1: Run full automated checks**

Run:

```bash
pnpm typecheck
pnpm test
pnpm build
```

Expected: all commands pass.

- [ ] **Step 2: Start local app**

Run:

```bash
pnpm dev
```

Expected:

- Server starts on `http://localhost:8787`.
- Vite prints a local frontend URL.

- [ ] **Step 3: Manually play through a smoke game**

In the browser:

- Start a game.
- Confirm human identity is visible.
- Confirm hidden roles are not visible in the player list.
- Submit required human night action if prompted.
- Submit day speech.
- Submit vote.
- Continue until either team wins.

Expected: the game reaches `game_over` without a server crash.

- [ ] **Step 4: Update README with run and model notes**

Add:

- Required environment variables.
- How to run server and web together.
- Note that API key remains server-side.
- Note that `.env` must not be committed.

- [ ] **Step 5: Commit verification docs**

Run:

```bash
git add README.md
git commit -m "docs: add MVP run instructions"
```

- [ ] **Step 6: Push implementation branch**

Run:

```bash
git status --short
git push
```

Expected: working tree is clean and remote is updated.

---

## Coverage Checklist

- 6-player fixed role setup: Task 3.
- Human random role assignment: Task 3.
- Rule engine for night, day, vote, and win checks: Task 4.
- Agent visible-state isolation: Task 3 and Task 5.
- OpenAI-compatible model layer: Task 5.
- HTTP JSON API transport: Task 6.
- Chat-style UI and action panels: Task 7.
- Model failure fallback behavior: Task 5 and Task 6.
- Automated rule tests: Task 3 and Task 4.
- Local playable verification: Task 8.
