import type { PublicMessage } from "@werewolf/shared";

interface ChatLogProps {
  messages: PublicMessage[];
  playerNameById: Map<string, string>;
}

export function ChatLog({ messages, playerNameById }: ChatLogProps) {
  return (
    <main className="panel chat-panel">
      <h2>群聊</h2>
      <div className="chat-log">
        {messages.map((message) => (
          <article className={`message ${message.type}`} key={message.id}>
            <div className="message-meta">
              <span>{message.speakerId ? playerNameById.get(message.speakerId) ?? message.speakerId : "系统"}</span>
              <span>第 {message.round} 轮</span>
            </div>
            <p>{message.content}</p>
          </article>
        ))}
      </div>
    </main>
  );
}
