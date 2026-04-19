import React from 'react';
import { MessageSquare } from "lucide-react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ChatWidget from "./components/ChatWidget";
import BottomNav from "./components/BottomNav";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="pb-16 sm:pb-0">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
      
      {/* Mobile Bottom Navigation */}
      <BottomNav />

      {/* Persistent Chat Bubble */}
      <ChatWidget />
    </div>
  );
}
