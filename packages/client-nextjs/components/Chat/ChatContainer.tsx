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
    <div className="pb-20">
      <div className="space-y-4">
        {messages.map((message, index) => (
          <Card
            key={index}
            className={`p-4 ${message.role === "user" ? "ml-12 bg-primary/10" : "mr-12 bg-muted"
              }`}
          >
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          </Card>
        ))}
        {streamingResponse && (
          <Card className="p-4 mr-12 bg-muted">
            <p className="text-sm whitespace-pre-wrap">{streamingResponse}</p>
          </Card>
        )}
      </div>
      <div className="fixed bottom-20 left-4 right-4 bg-background rounded">
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
