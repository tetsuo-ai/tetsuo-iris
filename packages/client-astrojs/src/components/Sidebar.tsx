import React from "react";

export default function Sidebar() {
  return (
    <nav className="max-w-24 h-full bg-zinc-900 p-2 flex flex-col gap-4">
      <img src="logo.webp" alt="Tetsuo AI Logo" className="w-14 h-14"/>
      <a href="/finance" className="bg-zinc-700 w-14 h-14 text-zinc-200 text-sm grid place-items-center">
        Finance
      </a>
      <a href="/chat" className="bg-zinc-700 w-14 h-14 text-zinc-200 text-sm grid place-items-center">
        Chat
      </a>
      <a href="/tools" className="bg-zinc-700 w-14 h-14 text-zinc-200 text-sm grid place-items-center">
        Tools
      </a>
      <a href="/media" className="bg-zinc-700 w-14 h-14 text-zinc-200 text-sm grid place-items-center">
        Media
      </a>
    </nav>
  );
}
