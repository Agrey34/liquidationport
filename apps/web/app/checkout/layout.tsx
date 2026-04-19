import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Secure Checkout - Liquidation Port",
};

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center">
             <span className="text-primary text-2xl font-black tracking-tight">Liquidation port</span>
          </Link>
          <div className="flex items-center gap-2 text-sm text-emerald-600 font-bold bg-emerald-50 px-3 py-1.5 rounded-md border border-emerald-100">
            <ShieldCheck className="w-4 h-4" /> SSL Encrypted Secure Checkout
          </div>
        </div>
      </header>
      
      <main className="flex-1">
        {children}
      </main>

      <footer className="py-8 text-center text-sm text-gray-500 border-t border-gray-200 mt-auto bg-white">
        <p>&copy; {new Date().getFullYear()} Liquidation Port. All rights reserved.</p>
        <div className="flex justify-center gap-4 mt-2">
          <Link href="/terms" className="hover:underline">Terms</Link>
          <Link href="/privacy-policy" className="hover:underline">Privacy</Link>
        </div>
      </footer>
    </div>
  );
}
