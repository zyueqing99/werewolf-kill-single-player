import { buildServer } from "./api/server";

const port = Number(process.env.PORT ?? 8787);
const app = buildServer();

await app.listen({ port, host: "0.0.0.0" });
console.log(`狼人杀后端已启动：http://localhost:${port}`);
