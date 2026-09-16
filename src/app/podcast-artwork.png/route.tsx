import { ImageResponse } from "next/og";

/**
 * Square show artwork referenced by the RSS feed (itunes:image) and structured
 * data. Apple Podcasts requires 1400–3000px square; this is generated once at
 * build time. Replace it with designed artwork by deleting this route and
 * adding a real file at public/podcast-artwork.png.
 */
export const dynamic = "force-static";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#16181f",
          backgroundImage:
            "radial-gradient(1400px circle at 80% 10%, rgba(45,160,175,0.45), transparent 60%), radial-gradient(1100px circle at 10% 95%, rgba(226,150,60,0.25), transparent 60%)",
        }}
      >
        <svg viewBox="0 0 24 24" width="1300" height="1300" fill="none" stroke="#e9f4f5" strokeWidth="2.2" strokeLinecap="round">
          <path d="M5 10v4M9.5 6.5v11M14.5 8.5v7M19 10.5v3" />
        </svg>
      </div>
    ),
    { width: 3000, height: 3000, headers: { "Cache-Control": "public, max-age=86400" } },
  );
}
