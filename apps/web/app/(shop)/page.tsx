import Hero from "./components/Hero";
import FeaturedListings from "./components/FeaturedListings";
import Benefits from "./components/Benefits";
import FeaturedBrands from "./components/FeaturedBrands";
import CategoryGrid from "./components/CategoryGrid";

export default function Home() {
  return (
    <>
      <Hero />
      <CategoryGrid />
      <FeaturedListings />
      <Benefits />
      <FeaturedBrands />
    </>
  );
}
