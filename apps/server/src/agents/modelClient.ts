export interface ModelClient {
  completeJson(prompt: string): Promise<string>;
}

interface ChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

export function createModelClientFromEnv(env: NodeJS.ProcessEnv = process.env): ModelClient {
  const baseUrl = env.OPENAI_COMPAT_BASE_URL ?? "https://api.openai.com/v1";
  const apiKey = env.OPENAI_COMPAT_API_KEY;
  const model = env.OPENAI_COMPAT_MODEL ?? "gpt-4o-mini";

  return {
    async completeJson(prompt: string): Promise<string> {
      if (!apiKey) {
        throw new Error("缺少 OPENAI_COMPAT_API_KEY");
      }

      const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "system",
              content: "你是狼人杀单机游戏中的 AI 玩家。必须只返回合法 JSON。"
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`模型请求失败：${response.status}`);
      }

      const body = (await response.json()) as ChatCompletionResponse;
      const content = body.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error("模型响应缺少 content");
      }

      return content;
    }
  };
}
