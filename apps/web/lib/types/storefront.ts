export interface AnnouncementConfig {
  enabled: boolean;
  text: string;
  badge: string;
  linkText: string;
  linkUrl: string;
  bgColor: string;
  textColor: string;
}

export interface HeroConfig {
  headline: string;
  subheadline: string;
  badgeText: string;
  primaryCtaText: string;
  primaryCtaLink: string;
  secondaryCtaText: string;
  secondaryCtaLink: string;
  heroImage: string;
}

export interface BrandLogoItem {
  id: string;
  name: string;
  logoUrl: string;
  discountText?: string;
}

export interface BrandsConfig {
  title: string;
  subtitle: string;
  brands: BrandLogoItem[];
}

export interface BenefitItem {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface BenefitsConfig {
  title: string;
  items: BenefitItem[];
}

export interface PromoBannerConfig {
  enabled: boolean;
  title: string;
  subtitle: string;
  badge: string;
  ctaText: string;
  ctaLink: string;
}

export interface StorefrontConfig {
  announcement: AnnouncementConfig;
  hero: HeroConfig;
  brands: BrandsConfig;
  benefits: BenefitsConfig;
  promoBanner: PromoBannerConfig;
}

export const DEFAULT_STOREFRONT_CONFIG: StorefrontConfig = {
  announcement: {
    enabled: true,
    text: "FREE Freight on Bulk Orders Over $5,000 | New Truckload Drops Live Every Tuesday",
    badge: "🔥 HOT DROP",
    linkText: "Browse Pallets",
    linkUrl: "/products",
    bgColor: "#111827",
    textColor: "#ffffff",
  },
  hero: {
    headline: "Source smarter.\nSell bigger.",
    subheadline:
      "Unlock exclusive liquidation deals from top brands and retailers for customer returns, overstock, and end-of-life merchandise.",
    badgeText: "⚡ Verified Liquidation Lots Direct",
    primaryCtaText: "Get started",
    primaryCtaLink: "/register",
    secondaryCtaText: "Explore Pallets",
    secondaryCtaLink: "/products",
    heroImage: "/herosectoin/truck2.png",
  },
  brands: {
    title: "Featured liquidators",
    subtitle: "Direct manifest access from global retail powerhouses.",
    brands: [
      { id: "1", name: "Walmart", logoUrl: "/companies-logos/walmart.svg", discountText: "Up to 85% OFF" },
      { id: "2", name: "Apple", logoUrl: "/companies-logos/apple.svg", discountText: "Refurb & Returns" },
      { id: "3", name: "Samsung", logoUrl: "/companies-logos/samsung-mono.svg", discountText: "Direct Lots" },
      { id: "4", name: "Hisense", logoUrl: "/companies-logos/hisense.svg", discountText: "Factory Overstock" },
      { id: "5", name: "Microsoft", logoUrl: "/companies-logos/microsoft.svg", discountText: "Tech Hardware" },
      { id: "6", name: "LG", logoUrl: "/companies-logos/lg.svg", discountText: "Appliances & TVs" },
      { id: "7", name: "HP", logoUrl: "/companies-logos/hp.svg", discountText: "Laptops & Printers" },
      { id: "8", name: "Ferguson", logoUrl: "/companies-logos/ferguson.svg", discountText: "Commercial & HVAC" },
    ],
  },
  benefits: {
    title: "Why Source With Liquidation Port",
    items: [
      {
        id: "1",
        title: "Source liquidation inventory direct",
        description:
          "Connect straight to top U.S. retailers and buy extra stock in bulk—no middleman markups. Snap up wholesale lots at prices you won't find anywhere else.",
        icon: "/Icons/handshake.svg",
      },
      {
        id: "2",
        title: "Total Price Transparency",
        description:
          "Our pricing tool displays real manifest histories and sales averages so you know exactly what similar lots sold for with zero guesswork.",
        icon: "/Icons/money-under-loupe.svg",
      },
      {
        id: "3",
        title: "Buy on your terms",
        description:
          "Make instant buy-now purchases or submit custom lot offers with flexible freight shipping and direct customer support.",
        icon: "/Icons/money-in-hand.svg",
      },
    ],
  },
  promoBanner: {
    enabled: true,
    title: "Ready to scale your liquidation sourcing?",
    subtitle: "Join 10,000+ verified resellers receiving daily drops & freight dispatch tracking.",
    badge: "VIP BUYER ACCESS",
    ctaText: "Create Buyer Account",
    ctaLink: "/register",
  },
};
