import Link from "next/link";
import Image from "next/image";

export default function Hero() {
  return (
    <div className="relative bg-secondary flex items-center pt-16 pb-20 overflow-hidden min-h-[600px]">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col md:flex-row items-center justify-between">
        
        {/* Left: Text Content */}
        <div className="w-full md:w-5/12 z-10 md:pr-10 lg:pl-12">
          <h1 className="text-5xl font-['Roboto',sans-serif] font-bold tracking-tight sm:text-6xl text-gray-900 leading-[1.1] ">
            Source smarter.<br />Sell bigger.
          </h1>
          <p className="mt-6 text-xl text-[#252525] max-w-lg font-medium">
            Unlock exclusive deals from top brands and retailers for customer
            returns, overstock, and end-of-life products.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <Link href="/register" className="inline-flex items-center justify-center px-8 py-3.5 border border-transparent text-sm font-bold rounded text-white bg-primary hover:bg-accent transition-colors shadow-sm">
              Get started
            </Link>
          </div>
        </div>

        {/* Right: Truck Image */}
        <div className="w-full md:w-7/12 mt-16 md:mt-0 relative flex justify-end min-h-[400px] md:min-h-[500px]">
          <Image
            src="/herosectoin/truck2.png"
            alt="Liquidation logistics"
            fill
            className="object-contain object-right drop-shadow-2xl"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />
        </div>
      </div>
    </div>
  );
}
