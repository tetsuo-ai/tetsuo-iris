"use client";

import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import { type FC } from "react";

const mediaPages = [
  {
    name: "Flux",
    description: "Generate Flux Images with your custom prompts.",
    href: "/media/flux",
  },
  {
    name: "DALL-E",
    description: "Generate vivid DALL-E images.",
    href: "/media/dalle",
  },
  {
    name: "Other Media",
    description: "Fetch Logos, Memes, and List Images.",
    href: "/media/other",
  },
];

const MediaCard: FC<{ page: typeof mediaPages[number] }> = ({ page }) => (
  <Link href={page.href}>
    <Card className="hover:bg-muted cursor-pointer transition-colors">
      <CardHeader>
        <CardTitle>{page.name}</CardTitle>
        <CardDescription>{page.description}</CardDescription>
      </CardHeader>
    </Card>
  </Link>
);

const MediaPage = () => {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Media Utilities</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mediaPages.map((page) => (
          <MediaCard key={page.name} page={page} />
        ))}
      </div>
    </div>
  );
};

export default MediaPage;
