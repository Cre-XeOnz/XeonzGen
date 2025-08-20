import { Header } from "@/components/header";
import { HeroSection } from "@/components/hero-section";
import { ImageGenerator } from "@/components/image-generator";
import { FeaturesSection } from "@/components/features-section";
import { ModelComparison } from "@/components/model-comparison";
import { Footer } from "@/components/footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <HeroSection />
      <ImageGenerator />
      <FeaturesSection />
      <Footer />
    </div>
  );
}
