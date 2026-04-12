import Image from "next/image";

export default function FeaturedBrands() {
  const logos = [
    { src: "/companies-logos/walmart.svg", alt: "Walmart" },
    { src: "/companies-logos/apple.svg", alt: "Apple" },
    { src: "/companies-logos/samsung-mono.svg", alt: "Samsung" },
    { src: "/companies-logos/hisense.svg", alt: "Hisense" },
    { src: "/companies-logos/microsoft.svg", alt: "Microsoft" },
    { src: "/companies-logos/lg.svg", alt: "LG" },
    { src: "/companies-logos/hp.svg", alt: "HP" },
    { src: "/companies-logos/ferguson.svg", alt: "Ferguson" },
  ];

  return (
    <div className="bg-secondary pb-16 pt-8">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-8 lg:pl-12">
          Featured liquidators
        </h2>
        
        {/* The user screenshot shows white rounded square cards beneath. We will render them. */}
        <div className="flex space-x-4 overflow-x-auto pb-4 px-2 lg:pl-12 scrollbar-hide">
          {logos.map((logo, idx) => (
            <div key={idx} className="flex justify-center shrink-0 w-64 h-48 bg-white rounded-xl shadow-sm border border-gray-100 transition-shadow hover:shadow-md items-center p-8">
              <Image src={logo.src} alt={logo.alt} width={120} height={60} className="object-contain max-h-16 w-auto grayscale" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
