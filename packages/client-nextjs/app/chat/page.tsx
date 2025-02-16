"use client";

import { type FC } from "react";
import Link from "next/link";

import Navbar from "@/components/Navbar";

type Agent = {
  name: string;
  description: string;
  emoji: string;
};

const agents: Agent[] = [
  {
    name: "Trader",
    description: "Your personal financial advisor and trading expert",
    emoji: "📈",
  },
  {
    name: "Professor",
    description: "Your academic mentor and knowledge guide",
    emoji: "👨‍🏫",
  },
  {
    name: "Planner",
    description: "Your organizational and productivity specialist",
    emoji: "📅",
  },
  {
    name: "Self-Help",
    description: "Your personal development and wellness coach",
    emoji: "🌱",
  },
];

const AgentCard: FC<{ agent: Agent }> = ({ agent }) => {
  return (
    <Link href={`/chat/${agent.name.toLowerCase()}`}>
      <div
        className="h-56 p-8 bg-zinc-900 grid place-items-center rounded-md hover:cursor-pointer hover:bg-gradient-to-br hover:from-zinc-700 hover:via-zinc-800 hover:to-zinc-900">
        <div className="text-center flex flex-col gap-2">
          <h3 className="text-zinc-200 text-4xl orbitron-600">
            {agent.emoji} {agent.name}
          </h3>
          <p className="text-zinc-500 text-lg jetbrains-mono-500">
            {agent.description}
          </p>
        </div>
      </div>
    </Link>
  );
};

export default function Chat() {
  return (
    <main className="bg-zinc-950">
      <div className="p-4 h-screen flex flex-col gap-4 overflow-hidden">
        <Navbar />
        <div className="grow grid place-items-center">
          <div className="max-w-screen-lg grid grid-cols-2 gap-4">
            {agents.map((agent) => (
              <AgentCard key={agent.name} agent={agent} />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
