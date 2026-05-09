# 6 人局狼人杀 MVP 实施计划

> **给执行 agent 的要求：** 必须使用 `superpowers:subagent-driven-development`（推荐）或 `superpowers:executing-plans` 按任务执行。本计划使用复选框语法记录进度。

**目标：** 构建一个本地浏览器版 6 人狼人杀 MVP：1 名真人玩家随机获得身份，和 5 名 AI agent 完成一整局对局。

**架构：** 使用 TypeScript 工作区组织代码：共享领域类型、后端纯规则引擎、OpenAI 兼容 agent 适配层、HTTP JSON API、React/Vite 前端。后端是唯一权威状态源，只向前端返回真人玩家可见状态。

**技术栈：** TypeScript、pnpm workspace、Node.js、Fastify、Vitest、React、Vite、普通 CSS、OpenAI 兼容 Chat Completions API。

---

## 文件结构

第一版创建一个小型工作区，按职责拆分文件：

- `package.json`：根目录脚本。
- `pnpm-workspace.yaml`：工作区包列表。
- `tsconfig.base.json`：共享 TypeScript 配置。
- `.gitignore`：忽略依赖、构建产物、环境变量和日志。
- `.env.example`：记录模型配置项。
- `packages/shared/src/types.ts`：共享角色、玩家、阶段、消息、动作、可见状态类型。
- `packages/shared/src/index.ts`：共享包导出入口。
- `packages/shared/package.json`：共享包元数据。
- `apps/server/src/game/rules.ts`：规则常量和纯规则辅助函数。
- `apps/server/src/game/createGame.ts`：创建对局、创建玩家、随机分配身份。
- `apps/server/src/game/visibleState.ts`：生成前端视角和 agent 视角。
- `apps/server/src/game/reducer.ts`：状态流转和动作校验。
- `apps/server/src/game/fallbacks.ts`：模型失败时的兜底决策。
- `apps/server/src/agents/modelClient.ts`：OpenAI 兼容 HTTP 客户端。
- `apps/server/src/agents/prompts.ts`：只基于可见信息构造 prompt。
- `apps/server/src/agents/agentService.ts`：JSON 解析、重试、兜底编排。
- `apps/server/src/api/server.ts`：Fastify 应用和 HTTP 路由。
- `apps/server/src/index.ts`：后端启动入口。
- `apps/server/test/game/*.test.ts`：规则引擎测试。
- `apps/server/test/agents/*.test.ts`：prompt、解析和兜底测试。
- `apps/server/package.json`：后端脚本和依赖。
- `apps/server/tsconfig.json`：后端 TypeScript 配置。
- `apps/server/vitest.config.ts`：后端测试配置。
- `apps/web/src/api.ts`：前端 HTTP API 客户端。
- `apps/web/src/App.tsx`：主界面。
- `apps/web/src/components/*.tsx`：玩家列表、聊天记录、操作面板、身份面板。
- `apps/web/src/styles.css`：MVP 布局和视觉样式。
- `apps/web/src/main.tsx`：React 入口。
- `apps/web/package.json`：前端脚本和依赖。
- `apps/web/tsconfig.json`：前端 TypeScript 配置。
- `apps/web/vite.config.ts`：Vite 配置和 `/api` 代理。

---

### 任务 1：搭建工作区

**文件：**
- 新建：`package.json`
- 新建：`pnpm-workspace.yaml`
- 新建：`tsconfig.base.json`
- 新建：`.gitignore`
- 新建：`.env.example`
- 修改：`README.md`

- [ ] **步骤 1：创建根目录包配置**

创建 `package.json`：

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

- [ ] **步骤 2：创建工作区和 TypeScript 基础配置**

创建 `pnpm-workspace.yaml`：

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

创建 `tsconfig.base.json`：

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

- [ ] **步骤 3：创建环境变量示例和忽略规则**

创建 `.gitignore`：

```gitignore
node_modules
dist
coverage
.env
.env.local
*.log
.DS_Store
```

创建 `.env.example`：

```bash
PORT=8787
OPENAI_COMPAT_BASE_URL=https://api.openai.com/v1
OPENAI_COMPAT_API_KEY=replace-me
OPENAI_COMPAT_MODEL=gpt-4o-mini
```

- [ ] **步骤 4：更新 README 的本地启动说明**

将 `README.md` 改为：

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

- [ ] **步骤 5：安装依赖**

运行：

```bash
pnpm install
```

预期结果：生成 `pnpm-lock.yaml`，安装成功。

- [ ] **步骤 6：提交工作区骨架**

运行：

```bash
git add package.json pnpm-workspace.yaml tsconfig.base.json .gitignore .env.example README.md pnpm-lock.yaml
git commit -m "chore: scaffold TypeScript workspace"
```

---

### 任务 2：添加共享领域类型

**文件：**
- 新建：`packages/shared/package.json`
- 新建：`packages/shared/src/types.ts`
- 新建：`packages/shared/src/index.ts`
- 新建：`packages/shared/tsconfig.json`

- [ ] **步骤 1：创建共享包配置**

创建 `packages/shared/package.json`：

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

- [ ] **步骤 2：定义共享类型**

创建 `packages/shared/src/types.ts`：

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

- [ ] **步骤 3：创建共享包导出入口**

创建 `packages/shared/src/index.ts`：

```ts
export * from "./types";
```

- [ ] **步骤 4：添加共享包 TypeScript 配置**

创建 `packages/shared/tsconfig.json`：

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

- [ ] **步骤 5：验证共享包**

运行：

```bash
pnpm --filter @werewolf/shared typecheck
pnpm --filter @werewolf/shared build
```

预期结果：两个命令都通过。

- [ ] **步骤 6：提交共享类型**

运行：

```bash
git add packages/shared
git commit -m "feat(shared): add game domain types"
```

---

### 任务 3：实现对局创建和可见状态

**文件：**
- 新建：`apps/server/package.json`
- 新建：`apps/server/tsconfig.json`
- 新建：`apps/server/vitest.config.ts`
- 新建：`apps/server/src/game/types.ts`
- 新建：`apps/server/src/game/rules.ts`
- 新建：`apps/server/src/game/createGame.ts`
- 新建：`apps/server/src/game/visibleState.ts`
- 新建：`apps/server/test/game/createGame.test.ts`
- 新建：`apps/server/test/game/visibleState.test.ts`

- [ ] **步骤 1：创建后端包配置**

创建 `apps/server/package.json`：

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

创建 `apps/server/tsconfig.json` 和 `apps/server/vitest.config.ts`，继承根目录配置，并使用 Node 测试环境。

- [ ] **步骤 2：先写创建对局测试**

创建测试，覆盖：

- 新对局正好有 6 名玩家。
- 身份数量为 2 狼人、1 预言家、1 女巫、2 村民。
- 正好 1 名玩家是 `kind: "human"`。
- 初始阶段是 `night_werewolf`。

运行：

```bash
pnpm --filter @werewolf/server test apps/server/test/game/createGame.test.ts
```

预期结果：失败，因为实现文件还不存在。

- [ ] **步骤 3：实现内部状态类型和创建逻辑**

在 `apps/server/src/game/types.ts` 定义：

- `GameState`
- `PlayerState`
- `NightState`
- `VoteState`
- `AgentPersona`

在 `apps/server/src/game/createGame.ts` 实现 `createGame({ humanPlayerId?, rng? })`：

- 创建 6 名玩家：`你`、`林夕`、`周野`、`沈舟`、`许宁`、`顾白`。
- 设置 1 名真人和 5 名 agent。
- 随机打乱固定身份列表。
- 从第 1 晚的 `night_werewolf` 开始。
- 初始化女巫解药和毒药为可用。
- 添加一条不泄露隐藏身份的系统开局消息。

- [ ] **步骤 4：运行创建对局测试**

运行：

```bash
pnpm --filter @werewolf/server test apps/server/test/game/createGame.test.ts
```

预期结果：通过。

- [ ] **步骤 5：先写可见状态测试**

创建测试，覆盖：

- 真人可见状态包含真人自己的身份。
- 真人是狼人时能看到狼队友 ID。
- 真人是村民时看不到隐藏身份。
- 公开玩家列表不会暴露存活玩家的隐藏身份。
- 狼人 agent 视角包含队友信息。
- 村民 agent 视角不包含隐藏身份信息。

运行：

```bash
pnpm --filter @werewolf/server test apps/server/test/game/visibleState.test.ts
```

预期结果：实现前失败。

- [ ] **步骤 6：实现视角投影**

在 `visibleState.ts` 实现：

- `toHumanVisibleState(game: GameState): VisibleGameState`
- `toAgentVisibleState(game: GameState, agentId: string)`

要求：这两个函数都不能返回完整隐藏状态。agent 视角是服务端内部使用的结构，不需要和前端响应完全一致。

- [ ] **步骤 7：运行可见状态测试**

运行：

```bash
pnpm --filter @werewolf/server test apps/server/test/game/visibleState.test.ts
```

预期结果：通过。

- [ ] **步骤 8：提交对局创建和视角隔离**

运行：

```bash
git add apps/server packages/shared package.json pnpm-lock.yaml
git commit -m "feat(server): add game creation and visibility rules"
```

---

### 任务 4：实现核心规则状态机

**文件：**
- 新建：`apps/server/src/game/reducer.ts`
- 新建：`apps/server/test/game/night.test.ts`
- 新建：`apps/server/test/game/vote.test.ts`
- 新建：`apps/server/test/game/winConditions.test.ts`

- [ ] **步骤 1：先写夜晚结算测试**

创建测试，覆盖：

- 狼人击杀会记录当晚被杀目标。
- 预言家查验狼人得到 `werewolves`，查验非狼人得到 `villagers`。
- 女巫使用解药会阻止当晚被杀目标死亡，并消耗解药。
- 女巫使用毒药会毒死目标，并消耗毒药。
- 已死亡玩家不会出现在后续候选目标里。

运行：

```bash
pnpm --filter @werewolf/server test apps/server/test/game/night.test.ts
```

预期结果：失败。

- [ ] **步骤 2：实现夜晚 reducer 函数**

在 `reducer.ts` 实现纯函数：

- `submitWerewolfKill(game, actorId, targetId)`
- `submitSeerCheck(game, actorId, targetId)`
- `submitWitchAction(game, actorId, action)`
- `advanceAfterNight(game)`

每个函数返回新的 `GameState`，并校验阶段、行动者身份、行动者存活状态、目标存活状态。

- [ ] **步骤 3：运行夜晚测试**

运行：

```bash
pnpm --filter @werewolf/server test apps/server/test/game/night.test.ts
```

预期结果：通过。

- [ ] **步骤 4：先写投票测试**

创建测试，覆盖：

- 存活玩家的合法投票会被记录。
- 同一玩家重复投票时采用“后投覆盖前投”的 MVP 规则。
- 最高票目标被放逐。
- 最高票平票时无人出局。
- 被放逐玩家状态变为死亡。

运行：

```bash
pnpm --filter @werewolf/server test apps/server/test/game/vote.test.ts
```

预期结果：失败。

- [ ] **步骤 5：实现发言和投票 reducer 函数**

在 `reducer.ts` 实现：

- `submitSpeech(game, playerId, content)`
- `submitVote(game, voterId, targetId?)`
- `resolveVotes(game)`
- `advanceToNextNight(game)`

要求：公开消息中追加真人和 agent 发言、投票摘要、放逐结果、平票无人出局结果。

- [ ] **步骤 6：运行投票测试**

运行：

```bash
pnpm --filter @werewolf/server test apps/server/test/game/vote.test.ts
```

预期结果：通过。

- [ ] **步骤 7：先写胜负判断测试**

创建测试，覆盖：

- 狼人全灭时好人胜利。
- 存活狼人人数大于等于存活非狼人人数时狼人胜利。
- 双方都能继续时没有胜者。
- 夜晚死亡结算后和放逐结算后都会检查胜负。

运行：

```bash
pnpm --filter @werewolf/server test apps/server/test/game/winConditions.test.ts
```

预期结果：失败。

- [ ] **步骤 8：实现胜负和候选目标辅助函数**

在 `rules.ts` 实现：

- `getTeam(role: Role): Team`
- `getAlivePlayers(game)`
- `getWinner(game): Team | undefined`
- 狼人击杀、预言家查验、女巫毒药、投票的候选目标函数。

在夜晚结算和放逐结算后调用 `getWinner`。

- [ ] **步骤 9：运行规则测试套件**

运行：

```bash
pnpm --filter @werewolf/server test apps/server/test/game
```

预期结果：通过。

- [ ] **步骤 10：提交规则状态机**

运行：

```bash
git add apps/server/src/game apps/server/test/game
git commit -m "feat(server): implement werewolf rule reducer"
```

---

### 任务 5：实现 agent 适配层和兜底策略

**文件：**
- 新建：`apps/server/src/game/fallbacks.ts`
- 新建：`apps/server/src/agents/modelClient.ts`
- 新建：`apps/server/src/agents/prompts.ts`
- 新建：`apps/server/src/agents/agentService.ts`
- 新建：`apps/server/test/agents/fallbacks.test.ts`
- 新建：`apps/server/test/agents/prompts.test.ts`
- 新建：`apps/server/test/agents/agentService.test.ts`

- [ ] **步骤 1：先写兜底策略测试**

创建测试，覆盖：

- 发言兜底返回一段非空短文本。
- 狼人兜底在可能时选择一名存活非狼人。
- 预言家兜底在可能时选择一名未查验的存活目标。
- 女巫兜底默认不用解药、不用毒药。
- 投票兜底返回弃票。

运行：

```bash
pnpm --filter @werewolf/server test apps/server/test/agents/fallbacks.test.ts
```

预期结果：失败。

- [ ] **步骤 2：实现兜底辅助函数**

在 `fallbacks.ts` 导出：

- `fallbackSpeech()`
- `fallbackWerewolfKill(game, actorId)`
- `fallbackSeerCheck(game, actorId)`
- `fallbackWitchAction()`
- `fallbackVote()`

目标选择复用 `rules.ts` 里的候选目标函数。

- [ ] **步骤 3：运行兜底测试**

运行：

```bash
pnpm --filter @werewolf/server test apps/server/test/agents/fallbacks.test.ts
```

预期结果：通过。

- [ ] **步骤 4：先写 prompt 信息隔离测试**

创建测试，覆盖：

- 村民 prompt 不包含 `werewolfAllyIds`。
- 村民 prompt 不包含其他玩家隐藏身份。
- 狼人 prompt 包含队友 ID。
- prompt 包含公开消息和当前阶段。

运行：

```bash
pnpm --filter @werewolf/server test apps/server/test/agents/prompts.test.ts
```

预期结果：失败。

- [ ] **步骤 5：实现 prompt 构造函数**

在 `prompts.ts` 实现以下 prompt 构造：

- 白天发言
- 投票
- 狼人击杀
- 预言家查验
- 女巫行动

要求：所有 prompt 必须基于 `toAgentVisibleState` 构造，不能直接序列化原始 `GameState`。

- [ ] **步骤 6：实现模型客户端和 agent 服务**

在 `modelClient.ts` 实现 `createModelClientFromEnv()` 和 `completeJson(prompt)`，请求：

```text
POST {OPENAI_COMPAT_BASE_URL}/chat/completions
```

请求头使用：

```text
Authorization: Bearer {OPENAI_COMPAT_API_KEY}
```

模型名来自 `OPENAI_COMPAT_MODEL`。

在 `agentService.ts` 实现：

- JSON 解析失败后重试一次。
- 校验返回目标 ID 是否合法。
- JSON 非法、目标非法、模型请求异常时使用兜底策略。

- [ ] **步骤 7：运行 agent 测试**

运行：

```bash
pnpm --filter @werewolf/server test apps/server/test/agents
```

预期结果：使用 mock 模型客户端时通过。

- [ ] **步骤 8：提交 agent 层**

运行：

```bash
git add apps/server/src/agents apps/server/src/game/fallbacks.ts apps/server/test/agents
git commit -m "feat(server): add agent prompts and fallbacks"
```

---

### 任务 6：实现 HTTP API 和内存对局会话

**文件：**
- 新建：`apps/server/src/api/gameSession.ts`
- 新建：`apps/server/src/api/server.ts`
- 新建：`apps/server/src/index.ts`
- 新建：`apps/server/test/api/server.test.ts`

- [ ] **步骤 1：先写 API 测试**

使用 Fastify injection 创建测试，覆盖：

- `POST /api/game/start` 返回可见状态。
- `POST /api/game/speech` 在当前动作是发言时接受真人发言。
- `POST /api/game/vote` 在当前动作是投票时接受真人投票。
- `POST /api/game/night-action` 接受合法真人夜间行动。
- 响应中不包含原始隐藏身份映射或完整内部状态。

运行：

```bash
pnpm --filter @werewolf/server test apps/server/test/api/server.test.ts
```

预期结果：失败。

- [ ] **步骤 2：实现内存会话编排器**

在 `gameSession.ts` 实现单例内存会话：

- 开始新对局。
- 保存当前 `GameState`。
- 接收真人动作。
- 遇到 AI 专属步骤时调用 `agentService` 自动推进。
- 推进到下一个需要真人操作的阶段或游戏结束时停止。
- 返回 `toHumanVisibleState`。

- [ ] **步骤 3：实现 Fastify 路由**

在 `server.ts` 创建路由：

- `GET /api/health`
- `POST /api/game/start`
- `GET /api/game/state`
- `POST /api/game/speech`
- `POST /api/game/vote`
- `POST /api/game/night-action`
- `POST /api/game/next`

在 `index.ts` 中监听 `PORT || 8787`。

- [ ] **步骤 4：运行 API 测试和类型检查**

运行：

```bash
pnpm --filter @werewolf/server test apps/server/test/api/server.test.ts
pnpm --filter @werewolf/server typecheck
```

预期结果：通过。

- [ ] **步骤 5：提交 API 层**

运行：

```bash
git add apps/server/src/api apps/server/src/index.ts apps/server/test/api
git commit -m "feat(server): expose game HTTP API"
```

---

### 任务 7：构建 React MVP 界面

**文件：**
- 新建：`apps/web/package.json`
- 新建：`apps/web/tsconfig.json`
- 新建：`apps/web/vite.config.ts`
- 新建：`apps/web/index.html`
- 新建：`apps/web/src/main.tsx`
- 新建：`apps/web/src/api.ts`
- 新建：`apps/web/src/App.tsx`
- 新建：`apps/web/src/components/PlayerList.tsx`
- 新建：`apps/web/src/components/ChatLog.tsx`
- 新建：`apps/web/src/components/ActionPanel.tsx`
- 新建：`apps/web/src/components/IdentityPanel.tsx`
- 新建：`apps/web/src/styles.css`

- [ ] **步骤 1：创建前端包配置**

创建 `apps/web/package.json`：

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

- [ ] **步骤 2：添加 Vite 和 React 入口**

创建 `apps/web/vite.config.ts`：

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

创建 `index.html`、`src/main.tsx` 和 `tsconfig.json`。

- [ ] **步骤 3：实现前端 API 客户端**

在 `api.ts` 实现：

- `startGame()`
- `getState()`
- `submitSpeech(playerId, content)`
- `submitVote(voterId, targetId?)`
- `submitNightAction(request)`
- `requestNext()`

每个函数调用对应的 `/api/game/*` 端点，并返回 `VisibleGameState`。

- [ ] **步骤 4：实现 UI 组件**

构建单屏游戏界面：

- 左侧玩家列表。
- 中间聊天记录。
- 右侧操作面板。
- 底部或侧边身份面板。

操作面板根据 `state.currentAction.type` 渲染：

- `none`：继续按钮。
- `speech`：文本框和提交按钮。
- `vote`：候选按钮和弃票按钮。
- `werewolf_kill`：目标按钮。
- `seer_check`：目标按钮。
- `witch_save_or_poison`：解药和毒药控制。

- [ ] **步骤 5：添加 MVP 样式**

使用普通 CSS：

- 桌面端三栏布局。
- 移动端上下堆叠。
- 聊天记录独立滚动。
- 按钮和面板文字不溢出。
- 不做营销落地页。

- [ ] **步骤 6：验证前端构建**

运行：

```bash
pnpm --filter @werewolf/web typecheck
pnpm --filter @werewolf/web build
```

预期结果：通过。

- [ ] **步骤 7：提交前端界面**

运行：

```bash
git add apps/web
git commit -m "feat(web): add playable game interface"
```

---

### 任务 8：本地端到端验证

**文件：**
- 修改：`README.md`
- 修改：本任务检查失败时对应的实现文件，修复范围必须只围绕失败行为

- [ ] **步骤 1：运行全部自动化检查**

运行：

```bash
pnpm typecheck
pnpm test
pnpm build
```

预期结果：全部通过。

- [ ] **步骤 2：启动本地应用**

运行：

```bash
pnpm dev
```

预期结果：

- 后端启动在 `http://localhost:8787`。
- Vite 打印前端本地访问地址。

- [ ] **步骤 3：手动完成一局冒烟对局**

在浏览器中：

- 开始一局。
- 确认真人身份可见。
- 确认玩家列表不展示隐藏身份。
- 如果当前需要真人夜间行动，则提交夜间行动。
- 提交白天发言。
- 提交投票。
- 继续推进直到任意一方胜利。

预期结果：游戏进入 `game_over`，后端不崩溃。

- [ ] **步骤 4：补充 README 的运行和模型说明**

补充：

- 必要环境变量。
- 如何同时运行前端和后端。
- API key 只保存在后端环境变量中。
- `.env` 不允许提交。

- [ ] **步骤 5：提交验证文档**

运行：

```bash
git add README.md
git commit -m "docs: add MVP run instructions"
```

- [ ] **步骤 6：推送实现分支**

运行：

```bash
git status --short
git push
```

预期结果：工作区干净，远端已更新。

---

## 覆盖检查

- 固定 6 人身份配置：任务 3。
- 真人玩家随机参与身份分配：任务 3。
- 夜晚、白天、投票、胜负判断规则引擎：任务 4。
- agent 可见状态隔离：任务 3 和任务 5。
- OpenAI 兼容模型层：任务 5。
- HTTP JSON API 通信：任务 6。
- 群聊式界面和操作面板：任务 7。
- 模型失败兜底：任务 5 和任务 6。
- 自动化规则测试：任务 3 和任务 4。
- 本地可玩验证：任务 8。
