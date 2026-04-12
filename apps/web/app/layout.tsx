import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./(shop)/styles/globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

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
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans relative">
          {children}
      </body>
    </html>
  );
}
