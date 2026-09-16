import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

/** Favicon generated from the same sound-wave mark as the header logo. */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 14,
          backgroundColor: "#0f7c86",
        }}
      >
        <svg viewBox="0 0 24 24" width="44" height="44" fill="none" stroke="#ffffff" strokeWidth="2.6" strokeLinecap="round">
          <path d="M5 10v4M9.5 6.5v11M14.5 8.5v7M19 10.5v3" />
        </svg>
      </div>
    ),
    size,
  );
}
