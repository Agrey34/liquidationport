import Image from "next/image";

export default function Benefits() {
  const benefits = [
    {
      name: "Source liquidation inventory direct",
      description: "Connect straight to top U.S. retailers and buy their extra stock in bulk—no middleman needed. You'll see what's in stock right now and snap up wholesale lots at prices you won't find anywhere else. It's an easy way to cut out extra fees and keep more profit in your pocket.",
      icon: "/Icons/handshake.svg",
    },
    {
      name: "Price transparency",
      description: "Our pricing tool shows you the full sales history for every pallet, so you know exactly what similar lots sold for. No more guessing or jumping between sites. With transparent data at your fingertips, you can make smarter bids or buy instantly with confidence.",
      icon: "/Icons/money-under-loupe.svg",
    },
    {
      name: "Buy on your terms",
      description: "Decide whether to make an offer or buy now for instant purchase and fast delivery. Either way, you'll get flexible payment and shipping options that fit your timeline. Plus, our support team is here to help you at every step—from placing your order to tracking your shipment.",
      icon: "/Icons/money-in-hand.svg",
    },
  ];

  return (
    <section className="bg-[#f4f5f7] py-16 sm:py-24">
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Title */}
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111] mb-8">
          Benefits
        </h2>

        {/* White Card Container */}
        <div className="bg-white rounded-2xl shadow-sm p-8 sm:p-12 lg:p-14">
          <div className="grid grid-cols-1 gap-12 lg:gap-16 sm:grid-cols-1 lg:grid-cols-3">
            {benefits.map((benefit) => (
              <div key={benefit.name} className="flex flex-col items-start text-left">
                {/* Icon */}
                <div className="relative h-30 w-34 mb-6">
                  <Image 
                    src={benefit.icon} 
                    alt={benefit.name} 
                    fill 
                    className="object-contain object-left" 
                  />
                </div>
                
                {/* Title */}
                <h3 className="text-xl font-bold leading-7 text-[#111] mb-4">
                  {benefit.name}
                </h3>
                
                {/* Description */}
                <p className="text-[15px] leading-relaxed text-[#333]">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
