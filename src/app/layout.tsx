import type { Metadata } from "next";
import clsx from "clsx";

import { inter } from "@/utils/fonts";
import { Providers } from "./providers";
import { WalletContextProvider } from "@/components/Wallet/WalletContextProvider";
import "@radix-ui/themes/styles.css";
import { Toaster } from "react-hot-toast";
import "@/styles/reset.css";
import "@/styles/globals.css";
import { ThemeProvider } from "@/components/Theme/ThemeProvider";

export const metadata: Metadata = {
  title: "Cousin NFT X Verification",
};

const RootLayout = ({ children }: { children: React.ReactNode }) => (
  <html
    lang="en"
    className={clsx(inter.className, inter.variable)}
    suppressHydrationWarning
  >
    <body>
      <ThemeProvider attribute="class">
        <WalletContextProvider>
          <Toaster />
          <Providers>{children}</Providers>
        </WalletContextProvider>
      </ThemeProvider>
    </body>
  </html>
);

export default RootLayout;
