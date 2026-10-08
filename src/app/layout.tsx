import type { Metadata, Viewport } from "next";
import { Vazirmatn } from "next/font/google";

import { ThemeScript } from "@/components/theme-script";
import { siteConfig } from "@/config/site";
import { feedAlternate } from "@/lib/seo";

import "./globals.css";

const vazirmatn = Vazirmatn({
  variable: "--font-vazirmatn",
  subsets: ["arabic", "latin"],
  display: "swap",
  weight: "variable",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — ${siteConfig.tagline}`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  authors: [{ name: siteConfig.author.name }],
  creator: siteConfig.author.name,
  publisher: siteConfig.name,
  // No canonical here: it would be inherited by the 404 page. Each page sets its own.
  alternates: { types: feedAlternate },
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.description,
  },
  // Title and description fall back to the og: tags, so inner pages never show the home page's.
  twitter: { card: "summary_large_image" },
  // Indexing is the default. Spelling out "index, follow" here contradicted the
  // `noindex` Next adds to 404 responses.
  robots: { googleBot: { "max-image-preview": "large", "max-snippet": -1 } },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fdfcfa" },
    { media: "(prefers-color-scheme: dark)", color: "#16181f" },
  ],
  colorScheme: "light dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang={siteConfig.htmlLang}
      dir={siteConfig.direction}
      className={`${vazirmatn.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
      </head>
      <body className="font-sans min-h-full flex flex-col bg-canvas text-ink">{children}</body>
    </html>
  );
}
