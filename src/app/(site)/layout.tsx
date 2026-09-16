import { Footer } from "@/components/site/footer";
import { Header } from "@/components/site/header";

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <a href="#main" className="skip-link">
        رفتن به محتوای اصلی
      </a>
      <Header />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
    </>
  );
}
