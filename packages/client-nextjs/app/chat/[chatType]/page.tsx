import { ChatAgentPage } from "@/components/pages/ChatPage/ChatAgentPage";
import { type ChatType } from "@/mutations/useChatCompletion";

export default async function ChatAgent({
  params,
}: {
  params: Promise<{ chatType: ChatType }>;
}) {
  const chatType = (await params).chatType;

  return <ChatAgentPage chatType={chatType} />;
}
