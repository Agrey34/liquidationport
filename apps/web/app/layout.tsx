import type { Metadata } from "next";
import "./(shop)/styles/globals.css";
import { StoreProvider } from "../lib/context/StoreContext";

export const metadata: Metadata = {
  title: "Liquidation Port: Wholesale Auctions of Liquidation Inventory",
  description: "Source smarter. Sell bigger.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased font-sans"
    >
      <body className="min-h-full flex flex-col font-sans relative">
        <StoreProvider>
          {children}
        </StoreProvider>
      </body>
    </html>
  );
}
