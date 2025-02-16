"use client"

import Image from "next/image";
import blueGalacticEye from "../app/images/blue-galactic-iris.png";

import Link from "next/link";
import Navbar from "@/components/Navbar";

const pagesUtilities = [
  {
    name: "Text Sentiment",
    description: "Analyze sentiment of custom text prompts",
    href: "/tools/sentiment",
  },
  {
    name: "Code Analysis",
    description: "Examines code in GitHub repo URL or provided text body",
    href: "/tools/code",
  },
  {
    name: "Text Summary",
    description: "Summarizes text in the URL or provided text body",
    href: "/tools/summary",
  },
  {
    name: "Web Search",
    description: "Searches for your query and provides a summarized response",
    href: "/tools/search",
  },
  {
    name: "Text to Speech",
    description: "Narrates voiceover for a given text",
    href: "/tools/speech",
  },
];

const pagesMedia = [
  {
    name: "Flux",
    description: "Generate Flux images with your custom prompts",
    href: "/media/flux",
  },
  {
    name: "DALL-E",
    description: "Generate vivid images using DALL-E",
    href: "/media/dalle",
  },
  {
    name: "Animate",
    description: "Generate RGB channel pass animation from image",
    href: "/media/animation",
  },
  {
    name: "Kensub",
    description: "Generate subtitled viral videos in a single click",
    href: "/media/kensub",
  },
  {
    name: "Launchpad SKRYR",
    description: "Universal multimedia launchpad and canvas",
    href: "/media/skryr",
  },
  {
    name: "Image API",
    description: "Fetch logos, memes and images",
    href: "/media/image",
  },
  {
    name: "Diablo 1 Game",
    description: "Play the iconic Diablo 1 game in the browser!",
    href: "/media/diablo",
  },
  {
    name: "DOSBOX Games",
    description: "Play nostalgic classic games in the browser!",
    href: "/media/dosgames",
  },
];

export default function Home() {
  return (
    <main className="bg-zinc-950 p-4">
      <Navbar />
      {/* Title */}
      <section className="mt-4 w-full grid place-items-center">
        <div className="w-[48rem] relative grid place-items-center">
          <Image
            src={blueGalacticEye}
            alt="An eye with blue galactic design"
            className="w-full rounded-md"
          />
          <div className="absolute grid place-items-center w-full p-2 bg-zinc-50/20 backdrop-blur-md">
            <h1 className="text-zinc-50 text-8xl orbitron-900">
              IRIS
            </h1>
          </div>
        </div>
      </section>

      {/* Finance and Chat */}
      <section className="mt-12 max-w-screen-lg flex flex-col mx-auto">
        <div className="w-full grid grid-cols-2 gap-4">
          <Link href="/finance">
            <div
              className="h-56 p-4 bg-zinc-900 grid place-items-center rounded-md hover:cursor-pointer hover:bg-gradient-to-br hover:from-zinc-700 hover:via-zinc-800 hover:to-zinc-900">
              <div className="text-center flex flex-col gap-2">
                <h3 className="text-zinc-200 text-4xl orbitron-600">
                  Financial Terminal
                </h3>
                <p className="text-rose-500 text-lg jetbrains-mono-500">
                  Trade TETSUO directly on IRIS
                </p>
              </div>
            </div>
          </Link>
          <Link href="/chat">
            <div
              className="h-56 p-4 bg-zinc-900 grid place-items-center rounded-md hover:cursor-pointer hover:bg-gradient-to-br hover:from-zinc-700 hover:via-zinc-800 hover:to-zinc-900">
              <div className="text-center flex flex-col gap-2">
                <h3 className="text-zinc-200 text-4xl orbitron-600">
                  LLM Chat
                </h3>
                <p className="text-yellow-500 text-lg jetbrains-mono-500">
                  Chat with our preset personalities!
                </p>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* Utilities / Tools */}
      <section className="mt-12 max-w-screen-lg flex flex-col mx-auto">
        <h2 className="text-emerald-500 orbitron-500 text-6xl">
          Utilities
        </h2>
        <div className="mt-8 w-full grid grid-cols-2 gap-4">
          {pagesUtilities.map((utility) => (
            <Link href={utility.href}>
              <div
                key={utility.href}
                className="h-56 p-4 bg-zinc-900 grid place-items-center rounded-md hover:cursor-pointer hover:bg-gradient-to-br hover:from-zinc-700 hover:via-zinc-800 hover:to-zinc-900">
                <div className="text-center flex flex-col gap-2">
                  <h3 className="text-zinc-200 text-4xl orbitron-600">
                    {utility.name}
                  </h3>
                  <p className="text-emerald-500 text-lg jetbrains-mono-500">
                    {utility.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Media Tools */}
      <section className="mt-12 max-w-screen-lg flex flex-col mx-auto">
        <h2 className="text-sky-500 orbitron-500 text-6xl">
          Media
        </h2>
        <div className="mt-8 w-full grid grid-cols-2 gap-4">
          {pagesMedia.map((media) => (
            <Link href={media.href} key={media.href}>
              <div
                className="h-56 p-4 bg-zinc-900 grid place-items-center rounded-md hover:cursor-pointer hover:bg-gradient-to-br hover:from-zinc-700 hover:via-zinc-800 hover:to-zinc-900">
                <div className="text-center flex flex-col gap-2">
                  <h3 className="text-zinc-200 text-4xl orbitron-600">
                    {media.name}
                  </h3>
                  <p className="text-sky-600 text-lg jetbrains-mono-500">
                    {media.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <hr className="mt-12 max-w-screen-lg mx-auto border-zinc-800"/>

      <footer className="my-12 max-w-screen-lg mx-auto">
        <span className="text-zinc-400 inter-400">2025 © tetsuo.ai</span>
      </footer>
    </main>
  );
}
