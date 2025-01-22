"use client";

import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import { type FC } from "react";
import Breadcrumbs from "@/components/Breadcrumbs";

const toolsPages = [
  {
    name: "Text Sentiment",
    description: "Analyze sentiment of custom text prompts.",
    href: "/tools/sentiment",
  },
  {
    name: "Text Summary",
    description: "Summarizes text in the URL or body provided.",
    href: "/tools/summary",
  },
  {
    name: "Text to Speech",
    description: "Narrates voice over for given text.",
    href: "/tools/speech",
  },
  {
    name: "Code Analysis",
    description: "Examines code in the GitHub repo URL or body provided.",
    href: "/tools/code",
  },
  {
    name: "Search the Web",
    description: "Searches for your query and provides a sumary answer.",
    href: "/tools/search",
  },
];

const ToolsCard: FC<{ page: typeof toolsPages[number] }> = ({ page }) => (
  <Link href={page.href}>
    <Card className="hover:bg-muted cursor-pointer transition-colors">
      <CardHeader>
        <CardTitle>{page.name}</CardTitle>
        <CardDescription>{page.description}</CardDescription>
      </CardHeader>
    </Card>
  </Link>
);

const ToolsPage = () => {
  return (
    <div className="container mx-auto py-8">
      <Breadcrumbs /> {/* Breadcrumb Navigation */}
      <h1 className="text-2xl font-bold mb-4">Tools Utilities</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {toolsPages.map((page) => (
          <ToolsCard key={page.name} page={page} />
        ))}
      </div>
    </div>
  );
};

export default ToolsPage;
