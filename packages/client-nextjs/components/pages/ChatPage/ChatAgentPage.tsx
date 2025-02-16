"use client";

import { FC } from "react";
import { ChatContainer } from "@/components/Chat/ChatContainer";
import { type ChatType } from "@/mutations/useChatCompletion";

import Navbar from "@/components/Navbar";

interface ChatAgentPageProps {
  chatType: ChatType;
}

export const ChatAgentPage: FC<ChatAgentPageProps> = ({ chatType }) => (
  <main className="bg-zinc-950 text-zinc-200">
    <div className="p-4 h-screen flex flex-col gap-4 overflow-hidden">
      <Navbar />
      <h2 className="orbitron-500 text-lg text-center max-w-screen-lg mx-auto bg-zinc-900 px-4 py-2 w-full rounded">
        {chatType}
      </h2>
      <div className="grow w-full max-w-screen-lg mx-auto">
        <ChatContainer chatType={chatType} />
      </div>
    </div>
  </main>
);
