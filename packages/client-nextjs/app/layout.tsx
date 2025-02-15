import type { Metadata } from "next";
import { ClientProviders } from "@/components/providers/ClientProviders";

import { Orbitron, JetBrains_Mono, Inter } from "next/font/google";

const orbitron = Orbitron({
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

import "./global.css";

export const metadata: Metadata = {
  title: "TETSUO Iris",
  description: "Your second set of eyes in the digital realm",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`antialiased ${orbitron.className} ${jetbrainsMono.className} ${inter.className} inter-400`}>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
