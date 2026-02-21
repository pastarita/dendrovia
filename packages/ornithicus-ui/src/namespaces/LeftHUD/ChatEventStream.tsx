/**
 * ChatEventStream — Event log / AI chat panel in the left HUD.
 */

import React from "react";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
}

export interface ChatEventStreamProps {
  messages?: ChatMessage[];
}

export const ChatEventStream: React.FC<ChatEventStreamProps> = ({
  messages = [],
}) => {
  return (
    <div className="ornithicus-chat-stream">
      {messages.map((msg) => (
        <div key={msg.id} className={`chat-message chat-${msg.role}`}>
          {msg.content}
        </div>
      ))}
    </div>
  );
};
