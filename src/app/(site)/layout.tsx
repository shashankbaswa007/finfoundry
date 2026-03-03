import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { EntranceProvider } from "@/lib/entrance-context";
import { BrandEntrance } from "@/components/shared/brand-entrance";
import { StockTicker } from "@/components/sections/stock-ticker";
import { CustomCursor } from "@/components/shared/custom-cursor";
import { ScrollProgress } from "@/components/shared/scroll-progress";
import { PageTransition } from "@/components/shared/page-transition";
import { EasterEgg } from "@/components/shared/easter-egg";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <EntranceProvider>
      <BrandEntrance />
      <CustomCursor />
      <ScrollProgress />
      <EasterEgg />
      <StockTicker />
      <Navbar />
      <main className="min-h-screen">
        <PageTransition>{children}</PageTransition>
      </main>
      <Footer />
    </EntranceProvider>
  );
}
