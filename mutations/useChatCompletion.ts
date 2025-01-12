import { useMutation } from "@tanstack/react-query";

export type ChatType = "trader" | "professor" | "planner" | "self-help";

export type ChatCompletionRequestMessage = {
  role: "system" | "user" | "assistant" | "function";
  content: string;
};

type ChatCompletionRequest = {
  messages: ChatCompletionRequestMessage[];
  stream: boolean;
  model: string;
  temperature?: number;
};

type UseChatMutationParams = {
  chatType: ChatType;
  chatCompletionRequest: ChatCompletionRequest;
  onProgress: (content: string) => void;
};

export function useChatMutation() {
  return useMutation({
    mutationFn: async ({ chatType, chatCompletionRequest, onProgress }: UseChatMutationParams) => {
      const response = await fetch("/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ chatType, chatCompletionRequest }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch chat completions");
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No readable stream found in response");
      }

      const decoder = new TextDecoder();
      let content = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine || trimmedLine === "[DONE]") continue;

          try {
            const jsonString = trimmedLine.replace(/^data: /, "");
            const json = JSON.parse(jsonString);
            const delta = json.choices[0]?.delta?.content || "";

            content += delta;
            onProgress(content);
          } catch (error) {
            console.warn("Failed to parse chunk:", trimmedLine, error);
          }
        }
      }

      return content;
    },
  });
}
