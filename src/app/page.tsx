import { siteConfig } from "@/config/site";

export default function HomePage() {
  return (
    <main className="container-page flex flex-1 flex-col justify-center py-24">
      <p className="text-sm font-semibold text-brand">{siteConfig.tagline}</p>
      <h1 className="mt-4 text-5xl">{siteConfig.name}</h1>
      <p className="mt-6 max-w-2xl text-lg text-ink-muted">{siteConfig.description}</p>
    </main>
  );
}
