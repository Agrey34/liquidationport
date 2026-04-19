import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Customer Authentication - Liquidation Port",
};

export default function CustomerAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center">
             <span className="text-primary text-2xl font-black tracking-tight">Liquidation port</span>
          </Link>
          <Link href="/" className="flex items-center gap-2 text-sm text-neutral-500 font-bold hover:text-neutral-900 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Store
          </Link>
        </div>
      </header>
      
      <main className="flex-1 flex flex-col">
        {children}
      </main>

      <footer className="py-6 text-center text-xs text-neutral-400 border-t border-gray-200 bg-white">
        <p>&copy; {new Date().getFullYear()} Liquidation Port. All rights reserved.</p>
      </footer>
    </div>
  );
}
