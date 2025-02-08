"use client";

import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import { type FC } from "react";
import Breadcrumbs from "@/components/Breadcrumbs";

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
    name: "Animate",
    description: "Generate RGB channel pass animation from image.",
    href: "/media/animation",
  },
  {
    name: "KenSub Video",
    description: "Generate video highlights in a single click.",
    href: "/media/kensub",
  },
  {
    name: "DingDong Editor",
    description: "Universal multimedia launchpad and canvas.",
    href: "/media/visuals",
  },
  {
    name: "Image API",
    description: "Fetch Logos, Memes, and List Images.",
    href: "/media/image",
  },
  {
    name: "Diablo 1 Game",
    description: "Play the iconic Diablo 1 game on tetsuo",
    href: "/media/diablo",
  },
  {
    name: "DOSBox Games",
    description: "Play nostalgic classic games on tetsuo",
    href: "/media/dosgames",
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
      <Breadcrumbs /> {/* Breadcrumb Navigation */}
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
