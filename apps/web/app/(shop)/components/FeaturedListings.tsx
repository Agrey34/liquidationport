import Image from "next/image";
import Link from "next/link";
import { Package } from "lucide-react";

// Mirroring the catalog mock data for consistency
const MOCK_PALLETS = [
  { id: '942502', title: 'Target Returns Electronics Pallet', retailer: 'Target', condition: 'Untested Returns', lot: '1 Pallet', qty: 45, msrp: 3200, price: 550, originalPrice: null, image: 'https://images.unsplash.com/photo-1555529771-835f59fc5efe?q=80&w=600&auto=format&fit=crop', category: 'Electronics', conditionGrade: 'Fair' },
  { id: '112004', title: 'Amazon Overstock Home Appliance Lot', retailer: 'Amazon', condition: 'Brand New (Box Damage)', lot: '2 Pallets', qty: 15, msrp: 4500, price: 1200, originalPrice: 1500, image: 'https://images.unsplash.com/photo-1583847268964-b28e5f884f67?q=80&w=600&auto=format&fit=crop', category: 'Home & Garden', conditionGrade: 'New' },
  { id: '850123', title: 'Mixed Summer Apparel - Brands Assorted', retailer: 'Macy\'s', condition: 'Shelf Pulls', lot: '1 Gaylord', qty: 250, msrp: 6500, price: 850, originalPrice: null, image: 'https://images.unsplash.com/photo-1542314831-c6a4d14effd0?q=80&w=600&auto=format&fit=crop', category: 'Apparel', conditionGrade: 'Like New' },
  { id: '343011', title: 'Children Toys & Games Holiday Clearout', retailer: 'Walmart', condition: 'Overstock', lot: '3 Pallets', qty: 150, msrp: 3500, price: 600, originalPrice: 850, image: 'https://images.unsplash.com/photo-1590845947376-2638caa89309?q=80&w=600&auto=format&fit=crop', category: 'Toys & Games', conditionGrade: 'New' },
];

export default function FeaturedListings() {
  return (
    <div className="bg-[#f0f2f5] py-16 sm:py-24">
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111]">
            Recently Added
          </h2>
          <Link href="/products" className="hidden sm:block text-primary font-bold hover:text-accent">
            View all inventory
          </Link>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {MOCK_PALLETS.map((pallet) => (
            <Link key={pallet.id} href={`/products/${pallet.id}`} className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col border border-transparent hover:border-neutral-200">
              
              <div className="relative aspect-[4/3] bg-neutral-100 overflow-hidden">
                <Image 
                  src={pallet.image} 
                  alt={pallet.title} 
                  fill 
                  className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out mix-blend-multiply" 
                />
                <div className="absolute top-3 left-3 flex gap-2">
                  <span className="px-2.5 py-1 bg-white/90 backdrop-blur-md text-neutral-900 text-[10px] font-black rounded-lg uppercase tracking-wider">{pallet.conditionGrade}</span>
                </div>
                <div className="absolute top-3 right-3">
                   <span className="px-2.5 py-1 bg-blue-600/90 text-white text-[10px] font-black rounded-lg uppercase tracking-wider shadow-sm">{pallet.retailer}</span>
                </div>
              </div>
              
              <div className="p-5 flex flex-col flex-1">
                <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-neutral-400 mb-2">
                  <span>Lot #{pallet.id}</span>
                  <span>•</span>
                  <span>{pallet.qty} Units</span>
                </div>
                <h3 className="font-extrabold text-[#111] leading-snug line-clamp-2 mb-3 group-hover:text-primary transition-colors">{pallet.title}</h3>
                
                <div className="mt-auto pt-4 border-t border-gray-100 flex justify-between items-end">
                  <div>
                     <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-0.5">Buy It Now</p>
                     <div className="flex items-baseline gap-2">
                       <span className="text-lg font-black text-[#111]">${pallet.price.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                     </div>
                  </div>
                  <div className="text-right">
                     <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-0.5">Est. MSRP</p>
                     <p className="text-sm font-semibold text-emerald-600">${pallet.msrp.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
        
        <div className="mt-8 flex justify-center sm:hidden">
          <Link href="/products" className="w-full bg-white border border-gray-300 text-gray-700 px-4 py-3 rounded-lg font-bold text-center hover:bg-gray-50">
            View all inventory
          </Link>
        </div>
      </div>
    </div>
  );
}
