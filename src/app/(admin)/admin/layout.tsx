import type { Metadata } from "next";

import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: { default: "پنل مدیریت", template: `%s | مدیریت ${siteConfig.name}` },
  // Belt and braces alongside robots.txt and the X-Robots-Tag header.
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminRootLayout({ children }: LayoutProps<"/admin">) {
  return <div className="flex min-h-full flex-1 flex-col bg-canvas">{children}</div>;
}
