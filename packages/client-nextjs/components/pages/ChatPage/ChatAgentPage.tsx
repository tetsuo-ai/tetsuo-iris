"use client";

import { FC } from "react";
import { ChatContainer } from "@/components/Chat/ChatContainer";
import { type ChatType } from "@/mutations/useChatCompletion";

interface ChatAgentPageProps {
  chatType: ChatType;
}

export const ChatAgentPage: FC<ChatAgentPageProps> = ({ chatType }) => (
  <ChatContainer chatType={chatType} />
);
