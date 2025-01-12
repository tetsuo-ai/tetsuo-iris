import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { type FC } from "react";
import Link from "next/link";

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
      <Card className="hover:bg-muted cursor-pointer transition-colors">
        <CardHeader>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{agent.emoji}</span>
            <CardTitle>{agent.name}</CardTitle>
          </div>
          <CardDescription>{agent.description}</CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
};

export default function Chat() {
  return (
    <div className="container mx-auto py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {agents.map((agent) => (
          <AgentCard key={agent.name} agent={agent} />
        ))}
      </div>
    </div>
  );
}
