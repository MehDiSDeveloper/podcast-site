import { PlayerBar } from "@/components/player/player-bar";
import { PlayerProvider } from "@/components/player/player-provider";
import { AmbientBackground } from "@/components/site/ambient-background";
import { Footer } from "@/components/site/footer";
import { Header } from "@/components/site/header";

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    // The provider wraps the whole site so the <audio> element survives every
    // client-side navigation and playback continues while browsing.
    <PlayerProvider>
      <div className="site flex flex-1 flex-col">
        <AmbientBackground />
        <a href="#main" className="skip-link">
          رفتن به محتوای اصلی
        </a>
        <Header />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer />
        <PlayerBar />
      </div>
    </PlayerProvider>
  );
}
