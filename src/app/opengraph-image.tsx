import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#070016",
          color: "#f8f1ff",
          padding: "64px 72px",
          backgroundImage:
            "radial-gradient(circle at 20% 20%, #ff3dce33, transparent 40%), radial-gradient(circle at 80% 80%, #3df0ff22, transparent 42%)",
        }}
      >
        <div style={{ fontSize: 28, letterSpacing: 8, color: "#3df0ff" }}>OUTRANK</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              fontSize: 72,
              lineHeight: 1.05,
              fontFamily: "Georgia, serif",
              maxWidth: 980,
            }}
          >
            Build a body of work, not a content calendar.
          </div>
          <div style={{ fontSize: 28, color: "#c4b3de", maxWidth: 820 }}>
            A coach for people who post on X.
          </div>
        </div>
        <div style={{ fontSize: 22, color: "#ffe14a" }}>outrank.coach</div>
      </div>
    ),
    size,
  );
}
