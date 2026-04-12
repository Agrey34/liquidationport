import Image from "next/image";

interface Listing {
  id: string;
  title: string;
  condition: string;
  lotSize: string;
  askPrice: number;
  images: string[];
}

const mockListings: Listing[] = [
  {
    id: "1",
    title: "1 Pallet - 25 Pcs - Storage & Organization",
    condition: "Untested Customer Returns",
    lotSize: "1 Pallet",
    askPrice: 380,
    images: [
      "/listings/lot1-img1.jpg",
      "/listings/lot1-img2.jpg",
      "/listings/lot1-img3.jpg",
      "/listings/lot1-img4.jpg",
    ],
  },
  {
    id: "2",
    title: "Mixed Consumer Electronics & Accessories",
    condition: "Salvage",
    lotSize: "1 Gaylord",
    askPrice: 450,
    images: [
      "/listings/lot2-img1.jpg",
      "/listings/lot2-img2.jpg",
      "/listings/lot2-img3.jpg",
      "/listings/lot2-img4.jpg",
    ],
  },
  {
    id: "3",
    title: "Home Appliances & Kitchenware",
    condition: "Like New",
    lotSize: "Less Than Truckload (LTL)",
    askPrice: 1250,
    images: [
      "/listings/lot3-img1.jpg",
      "/listings/lot3-img2.jpg",
      "/listings/lot3-img3.jpg",
      "/listings/lot3-img4.jpg",
    ],
  },
  {
    id: "4",
    title: "Assorted Toys & Games Overstock",
    condition: "New in Box",
    lotSize: "1 Pallet",
    askPrice: 890,
    images: [
      "/listings/lot4-img1.jpg",
      "/listings/lot4-img2.jpg",
      "/listings/lot4-img3.jpg",
      "/listings/lot4-img4.jpg",
    ],
  },
];

export default function FeaturedListings() {
  return (
    <div className="bg-white py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            Recently Added
          </h2>
          <a href="#" className="hidden sm:block text-primary font-medium hover:text-accent">
            View all
          </a>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {mockListings.map((listing) => (
            <div key={listing.id} className="group flex flex-col bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
              {/* Image Grid */}
              <div className="grid grid-cols-2 grid-rows-2 h-48 w-full">
                {listing.images.map((img, idx) => (
                  <div key={idx} className="relative w-full h-full border-[0.5px] border-white">
                    <Image
                      src={img}
                      alt={`Lot ${listing.id} image ${idx + 1}`}
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      className="absolute inset-0 w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                    />
                  </div>
                ))}
              </div>

              {/* Content */}
              <div className="p-4 flex flex-col flex-1">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 mb-2 self-start">
                  {listing.condition}
                </span>
                <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-4 flex-1">
                  {listing.title}
                </h3>
                
                {/* Footer of Card */}
                <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex flex-col text-xs text-gray-500">
                    <span className="mb-0.5">Lot Size</span>
                    <span className="font-semibold text-gray-900">{listing.lotSize}</span>
                  </div>
                  <div className="h-8 w-px bg-gray-200 mx-4"></div>
                  <div className="flex flex-col text-xs text-gray-500 text-right">
                    <span className="mb-0.5">Ask Price</span>
                    <span className="font-bold text-primary text-base">${listing.askPrice.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-center sm:hidden">
          <button className="w-full bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded font-medium hover:bg-gray-50">
            View all
          </button>
        </div>
      </div>
    </div>
  );
}
