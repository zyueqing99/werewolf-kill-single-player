# werewolf-kill-single-player

单机版狼人杀 MVP：1 名真人玩家 + 5 名 AI agent，在本地浏览器中完成 6 人局。

## 开发

```bash
pnpm install
cp .env.example .env
pnpm dev
```

前端默认运行在 `http://localhost:5173`，后端默认运行在 `http://localhost:8787`。

## 模型配置

`.env` 中配置 OpenAI 兼容接口：

```bash
PORT=8787
OPENAI_COMPAT_BASE_URL=https://api.openai.com/v1
OPENAI_COMPAT_API_KEY=replace-me
OPENAI_COMPAT_MODEL=gpt-4o-mini
```

API key 只由后端读取，不会暴露给浏览器。`.env` 已被 `.gitignore` 忽略，不要提交真实密钥。

当前 MVP 的 HTTP API 是本地单机请求/响应模式，不使用 WebSocket。

## 检查

```bash
pnpm typecheck
pnpm test
pnpm build
```
