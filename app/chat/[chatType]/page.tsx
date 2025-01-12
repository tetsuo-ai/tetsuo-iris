import { ChatAgentPage } from "@/components/pages/ChatPage/ChatAgentPage";
import { type ChatType } from "@/mutations/useChatCompletion";

export default function ChatAgent({
  params,
}: {
  params: { chatType: string };
}) {
  return <ChatAgentPage chatType={params.chatType as ChatType} />;
}
