import { config } from "dotenv";

import { buildServer } from "./api/server";

config({ path: "../../.env" });

const port = Number(process.env.PORT ?? 8787);
const app = buildServer();

await app.listen({ port, host: "0.0.0.0" });
console.log(`狼人杀后端已启动：http://localhost:${port}`);
console.log(
  `模型环境：baseURL=${process.env.OPENAI_COMPAT_BASE_URL ?? "未配置"}，model=${
    process.env.OPENAI_COMPAT_MODEL ?? "未配置"
  }，apiKey=${process.env.OPENAI_COMPAT_API_KEY ? "已配置" : "未配置"}`
);
