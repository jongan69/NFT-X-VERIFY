import type { Metadata } from "next";
import clsx from "clsx";
import { Toaster } from "react-hot-toast";

// Components
import { inter } from "@/utils/fonts";
import { Providers } from "@/components/Theme/providers";
import { WalletContextProvider } from "@/components/Wallet/WalletContextProvider";
import { ThemeProvider } from "@/components/Theme/ThemeProvider";
import Footer from "@/components/Footer";

// Styles
import "@radix-ui/themes/styles.css";
import "@/styles/reset.css";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Cousin NFT X Verification",
};

const RootLayout = ({ children }: { children: React.ReactNode }) => (
  <html
    lang="en"
    className={clsx(inter.className, inter.variable)}
    suppressHydrationWarning
  >
    <body className="flex min-h-screen flex-col">
      <ThemeProvider attribute="class">
        <WalletContextProvider>
          <Toaster />
          <Providers>
            <main>{children}</main>
            <Footer />
          </Providers>
        </WalletContextProvider>
      </ThemeProvider>
    </body>
  </html>
);

export default RootLayout;
