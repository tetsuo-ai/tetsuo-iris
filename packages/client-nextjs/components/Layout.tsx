"use client";

import dynamic from "next/dynamic";
import { FC, ReactNode } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { Wallet, MessageCircle, Wrench, Smile, PlayIcon } from "lucide-react";
import Logo from "@/app/images/logo.webp";
import { usePathname } from "next/navigation";
import { ThemeDropdown } from "./ThemeDropdown";

// Dynamically import WalletMultiButton to avoid SSR issues
const WalletMultiButton = dynamic(
  () => import("@solana/wallet-adapter-react-ui").then((mod) => mod.WalletMultiButton),
  { ssr: false }
);

const navItems = [
  { value: "finance", label: "Finance", icon: Wallet, href: "/finance" },
  { value: "chat", label: "Chat", icon: MessageCircle, href: "/chat" },
  { value: "tools", label: "Tools", icon: Wrench, href: "/tools" },
  { value: "media", label: "Media", icon: PlayIcon, href: "/media" },
];

export const Layout: FC<{ children: ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const activeTab = pathname.split("/")?.[1] || "finance";

  return (
    <div className="min-h-screen flex flex-col pb-20">
      {/* Header Section */}
      <header className="flex justify-between items-center p-4">
        <Link href="/finance" aria-label="Home">
          <img
            src={Logo.src}
            alt="Tetsuo Logo"
            className="w-14"
            width={Logo.width}
            height={Logo.height}
          />
        </Link>
        <div className="flex items-center gap-2">
          <ThemeDropdown />
          <WalletMultiButton />
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 flex-1">{children}</main>

      {/* Footer Tabs */}
      <footer className="fixed inset-x-0 bottom-0 bg-gray-100">
        <Tabs defaultValue={activeTab} className="w-full h-full">
          <TabsList className="w-full h-full">
            {navItems.map(({ value, label, icon: Icon, href }) => (
              <TabsTrigger key={value} value={value} asChild className="w-1/4">
                <Link href={href} className="flex flex-col items-center">
                  <Icon size={20} />
                  <span className="text-xs">{label}</span>
                </Link>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </footer>
    </div>
  );
};
