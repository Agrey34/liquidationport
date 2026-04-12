import React from 'react';
import { MessageSquare } from "lucide-react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
      
      {/* Persistent Chat Bubble */}
      <button className="fixed bottom-6 right-6 h-14 w-14 bg-primary text-white rounded-full flex items-center justify-center shadow-2xl hover:bg-accent transition-colors z-50">
        <MessageSquare className="h-6 w-6" fill="currentColor" />
      </button>
    </>
  );
}
