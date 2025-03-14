"use client";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import dynamic from "next/dynamic";

const ClientWalletButton = dynamic(() => Promise.resolve(WalletMultiButton), {
  ssr: false,
});

export default ClientWalletButton;
