import Link from "next/link";
import { Facebook, Linkedin, Youtube, Phone, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-white pt-16 pb-12 border-t border-gray-100">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-16">
          
          {/* Column 1: Sign up & Social */}
          <div className="flex flex-col">
            <h2 className="text-[20px] font-bold text-[#111] mb-5">
              Sign up to receive deals
            </h2>
            <form className="flex items-center w-full max-w-sm mb-4 space-x-3">
              <input
                type="email"
                placeholder="Email"
                required
                className="w-full grow rounded border border-gray-300 bg-white px-3 py-1.5 text-[14px] text-[#111] placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
              <button
                type="submit"
                className="whitespace-nowrap rounded border border-primary bg-white px-5 py-1.5 text-[13px] font-bold text-primary hover:bg-gray-50 transition-colors"
              >
                Sign up
              </button>
            </form>
            <p className="text-[13px] text-[#333] mb-8">
              Sign up now to receive exclusive member&apos;s only discounts.
            </p>

            <h3 className="text-[15px] font-bold text-[#111] mb-4">
              Follow us
            </h3>
            <div className="flex items-center space-x-4 mb-16">
              <a href="#" className="text-primary hover:opacity-80 transition-opacity">
                <span className="sr-only">Facebook</span>
                <Facebook size={24} className="fill-current" />
              </a>
              <a href="#" className="text-primary hover:opacity-80 transition-opacity">
                <span className="sr-only">LinkedIn</span>
                <Linkedin size={24} className="fill-current" />
              </a>
              <a href="#" className="text-primary hover:opacity-80 transition-opacity">
                <span className="sr-only">YouTube</span>
                <Youtube size={26} className="fill-current" />
              </a>
            </div>

            <p className="text-[11px] text-[#4a4a4a]">
              &copy; 2026 Direct Liquidation, a ReturnPro brand. All rights reserved.
            </p>
          </div>

          {/* Column 2: Help & Support */}
          <div>
            <h2 className="text-[20px] font-bold text-[#111] mb-5">
              Help & Support
            </h2>
            <ul className="space-y-3.5">
              <li>
                <Link href="/help" className="text-[13px] text-[#333] hover:underline">
                  Help center
                </Link>
              </li>
              <li>
                <a href="tel:1-800-679-9451" className="text-[13px] text-[#333] hover:underline flex items-center">
                  <Phone size={14} className="mr-2 fill-current" />
                  1-800-679-9451
                </a>
              </li>
              <li>
                <a href="mailto:support@liquidationport.com" className="text-[13px] text-[#333] hover:underline flex items-center">
                  <Mail size={14} className="mr-2 fill-current" />
                  support@liquidationport.com
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Our Story */}
          <div>
            <h2 className="text-[20px] font-bold text-[#111] mb-5">
              Our Story and Insights
            </h2>
            <ul className="space-y-3.5">
              <li>
                <Link href="/blog" className="text-[13px] text-[#333] hover:underline">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-[13px] text-[#333] hover:underline">
                  About us
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Legal */}
          <div>
            <h3 className="text-[20px] font-bold text-[#111] mb-5">
              Legal
            </h3>
            <ul className="space-y-3.5">
              <li>
                <Link href="/privacy" className="text-[13px] text-[#333] hover:underline">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-[13px] text-[#333] hover:underline">
                  Terms
                </Link>
              </li>
              <li>
                <Link href="/privacy-choices" className="text-[13px] text-[#333] hover:underline">
                  Your privacy choices
                </Link>
              </li>
              <li>
                <Link href="/accessibility" className="text-[13px] text-[#333] hover:underline">
                  Accessibility Options
                </Link>
              </li>
            </ul>
          </div>

        </div>
      </div>
    </footer>
  );
}
