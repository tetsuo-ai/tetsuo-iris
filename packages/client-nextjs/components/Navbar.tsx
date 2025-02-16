import Link from "next/link";
import dynamic from "next/dynamic";

import logo from "@/app/images/logo.webp";

const WalletMultiButton = dynamic(
  () => import("@solana/wallet-adapter-react-ui").then((mod) => mod.WalletMultiButton),
  { ssr: false }
);

export default function Navbar() {
  return (
    <nav className="flex justify-between items-center">
      <Link href="/">
        <img src={logo.src} alt="Tetsuo Logo" className="w-12" />
      </Link>
      <div className="flex items-center gap-2">
        <WalletMultiButton />
      </div>
    </nav>
  );
}
