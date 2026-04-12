import React from "react";
import HowItWorksNav from "./HowItWorksNav";

export default function HowItWorksLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Secondary Navigation (Tabs) */}
      <HowItWorksNav />
      {/* Page Content */}
      <main className="flex-1">{children}</main>
    </div>
  );
}
