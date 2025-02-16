import { useState, type FC } from "react";
import { ChatInput } from "./ChatInput";
import { Card } from "@/components/ui/card";
import { ChatType } from "@/mutations/useChatCompletion";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export const ChatContainer: FC<{ chatType: ChatType }> = ({ chatType }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamingResponse, setStreamingResponse] = useState("");

  const addMessage = (role: ChatMessage["role"], content: string) => {
    setMessages((prev) => [...prev, { role, content }]);
  };

  return (
    <div className="h-full flex flex-col justify-between gap-8">
      <div className="grow h-0 space-y-4 overflow-y-auto rounded">
        {messages.map((message, index) => (
          <Card
            key={index}
            className={`
              p-4 bg-zinc-900 rounded border-0 jetbrains-mono-400
              ${message.role === "user" ? "ml-40" : "mr-40 bg-blue-500/50"}
             `}
          >
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          </Card>
        ))}
        {streamingResponse && (
          <Card className="p-4 mr-40 bg-blue-500/50 rounded border-0 jetbrains-mono-400">
            <p className="text-sm whitespace-pre-wrap">{streamingResponse}</p>
          </Card>
        )}
      </div>
      <div className="jetbrains-mono-400">
        <ChatInput
          chatType={chatType}
          messages={messages}
          onSubmit={(userMessage) => addMessage("user", userMessage)}
          onMessageSent={(aiResponse) => addMessage("assistant", aiResponse)}
          setStreamingResponse={setStreamingResponse}
        />
      </div>
    </div>
  );
};
