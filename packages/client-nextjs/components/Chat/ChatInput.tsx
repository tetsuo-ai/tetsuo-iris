import { useState, useCallback, type FC } from "react";
import {
  type ChatCompletionRequestMessage,
  type ChatType,
  useChatMutation,
} from "@/mutations/useChatCompletion";
import { Button } from "@/components/ui/button";
import { ArrowUp, Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

type ChatInputProps = {
  chatType: ChatType;
  messages: ChatCompletionRequestMessage[];
  onSubmit: (userMessage: string) => void;
  onMessageSent: (aiResponse: string) => void;
  setStreamingResponse: (response: string) => void;
};

export const ChatInput: FC<ChatInputProps> = ({
  chatType,
  messages,
  onSubmit,
  onMessageSent,
  setStreamingResponse,
}) => {
  const [message, setMessage] = useState("");
  const chatMutation = useChatMutation();

  const handleSubmit = useCallback(
    async (e: React.FormEvent | React.KeyboardEvent) => {
      e.preventDefault();
      const trimmedMessage = message.trim();
      if (!trimmedMessage) return;

      setMessage("");
      setStreamingResponse("");
      onSubmit(trimmedMessage);

      const updatedMessages: ChatCompletionRequestMessage[] = [
        ...messages,
        { role: "user", content: trimmedMessage },
      ];

      try {
        await chatMutation.mutateAsync(
          {
            chatType,
            chatCompletionRequest: {
              messages: updatedMessages,
              model: "gpt-4o",
              stream: true,
            },
            onProgress: setStreamingResponse,
          },
          {
            onSuccess: (finalResponse) => {
              onMessageSent(finalResponse);
              setStreamingResponse("");
            },
            onError: () => {
              console.error("Chat error occurred");
              setStreamingResponse("Sorry, there was an error processing your request.");
            },
          }
        );
      } catch (error) {
        console.error("Chat error:", error);
        setStreamingResponse("Sorry, there was an error processing your request.");
      }
    },
    [message, messages, chatType, chatMutation, onSubmit, onMessageSent, setStreamingResponse]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e);
      }
    },
    [handleSubmit]
  );

  return (
    <form onSubmit={handleSubmit} className="relative">
      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type your message..."
        disabled={chatMutation.isPending}
        className="min-h-[80px] pr-[88px] resize-none"
      />
      <div className="absolute bottom-2 right-2">
        <Button
          type="submit"
          disabled={!message.trim() || chatMutation.isPending}
          variant="default"
        >
          {chatMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowUp className="h-4 w-4" />
          )}
        </Button>
      </div>
    </form>
  );
};
