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
    <head>
      <script
        async
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6202902142885850"
        crossOrigin="anonymous">
      </script>
      <meta
        name="description"
        content="Cousin NFT X Verification"
      />
      <link rel="icon" href="/favicon.ico" />

      <link
        rel="apple-touch-icon"
        sizes="180x180"
        href="/apple-touch-icon.png"
      />
      <link
        rel="icon"
        type="image/png"
        sizes="32x32"
        href="/favicon-32x32.png"
      />
      <link
        rel="icon"
        type="image/png"
        sizes="16x16"
        href="/favicon-16x16.png"
      />
      <link rel="manifest" href="/site.webmanifest" />
    </head>
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
