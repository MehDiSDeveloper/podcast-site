import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";

import { siteConfig } from "@/config/site";

/**
 * Shared Open Graph card renderer.
 *
 * Two things make Persian work here that would otherwise fail silently:
 *
 * 1. Satori has no system fonts, so Vazirmatn is bundled in src/assets/fonts
 *    and passed in explicitly — without it every glyph renders as a box.
 * 2. Satori does not implement the bidi algorithm. It lays a text run out
 *    left-to-right in source order, which reverses Persian sentences. The
 *    RtlText component below sidesteps that by emitting each word as its own
 *    element inside a `row-reverse` flex row, so the first word lands on the
 *    right. Words are split on ZWNJ too, because Satori treats it as a break
 *    opportunity and would otherwise swap the halves of words like «تعارض‌های».
 */

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

const ZWNJ = "‌";

let fontCache: { regular: ArrayBuffer; bold: ArrayBuffer } | null = null;

async function loadFonts() {
  if (fontCache) return fontCache;

  const dir = join(process.cwd(), "src/assets/fonts");
  const [regular, bold] = await Promise.all([
    readFile(join(dir, "Vazirmatn-Regular.ttf")),
    readFile(join(dir, "Vazirmatn-Bold.ttf")),
  ]);

  const toArrayBuffer = (buffer: Buffer) =>
    buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;

  fontCache = { regular: toArrayBuffer(regular), bold: toArrayBuffer(bold) };
  return fontCache;
}

function RtlText({
  text,
  gap,
  style,
}: {
  text: string;
  /** Word spacing in px. Satori resolves `em` against the inherited font size,
   *  not the one set on the same element, so gaps are passed explicitly. */
  gap: number;
  style?: React.CSSProperties;
}) {
  const words = text.split(/\s+/).filter(Boolean);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row-reverse",
        flexWrap: "wrap",
        columnGap: gap,
        rowGap: Math.round(gap * 0.6),
        ...style,
      }}
    >
      {words.map((word, index) => (
        <div key={index} style={{ display: "block" }}>
          {/*
            Satori also breaks a run at ZWNJ and lays those halves out
            left-to-right, so «تعارض‌های» would come out as «های‌تعارض».
            Reversing the halves in the source cancels that out, and keeping it
            one text node preserves the ZWNJ's natural (zero-width) spacing.
          */}
          {word.split(ZWNJ).reverse().join(ZWNJ)}
        </div>
      ))}
    </div>
  );
}

export async function renderOgImage({
  title,
  eyebrow,
  meta,
}: {
  title: string;
  eyebrow?: string;
  meta?: string;
}) {
  const fonts = await loadFonts();
  // Satori has no line clamping, so overlong titles are trimmed up front.
  const safeTitle = title.length > 95 ? `${title.slice(0, 95).trimEnd()}…` : title;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "68px 76px",
          backgroundColor: "#16181f",
          backgroundImage:
            "radial-gradient(900px circle at 85% 0%, rgba(45,160,175,0.3), transparent 55%), radial-gradient(700px circle at 5% 100%, rgba(226,150,60,0.16), transparent 55%)",
          color: "#f4f3f0",
          fontFamily: "Vazirmatn",
        }}
      >
        <div style={{ display: "flex", flexDirection: "row-reverse", alignItems: "center", gap: 18 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 58,
              height: 58,
              borderRadius: 15,
              backgroundColor: "#3aa7b8",
            }}
          >
            <svg viewBox="0 0 24 24" width="31" height="31" fill="none" stroke="#0f2024" strokeWidth="2.4" strokeLinecap="round">
              <path d="M5 10v4M9.5 6.5v11M14.5 8.5v7M19 10.5v3" />
            </svg>
          </div>
          <RtlText text={siteConfig.name} gap={10} style={{ fontSize: 34, fontWeight: 700 }} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 20 }}>
          {eyebrow ? (
            <RtlText text={eyebrow} gap={8} style={{ fontSize: 27, fontWeight: 700, color: "#6fc6d4" }} />
          ) : null}
          <RtlText
            text={safeTitle}
            gap={safeTitle.length > 52 ? 16 : 20}
            style={{
              fontSize: safeTitle.length > 52 ? 56 : 68,
              fontWeight: 700,
              lineHeight: 1.3,
              justifyContent: "flex-start",
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "row-reverse",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 25,
            color: "#9aa3b2",
            borderTop: "1px solid rgba(255,255,255,0.12)",
            paddingTop: 26,
          }}
        >
          <RtlText text={meta ?? siteConfig.author.role} gap={7} />
          <div style={{ display: "flex", color: "#e2a85a" }}>
            {siteConfig.url.replace(/^https?:\/\//, "")}
          </div>
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        { name: "Vazirmatn", data: fonts.regular, weight: 400, style: "normal" },
        { name: "Vazirmatn", data: fonts.bold, weight: 700, style: "normal" },
      ],
    },
  );
}
