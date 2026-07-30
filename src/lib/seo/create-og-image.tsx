import { ImageResponse } from "next/og";

export const ogSize = { width: 1200, height: 630 };
export const ogContentType = "image/png";

export function createOgImage(title: string, label = "Crealy") {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#080808",
          color: "#F7F7F5",
          padding: "72px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#111400",
              background: "#DDF527",
              fontWeight: 900,
              fontSize: 26,
            }}
          >
            C
          </div>
          <span style={{ fontSize: 30, fontWeight: 700 }}>{label}</span>
        </div>
        <div style={{ display: "flex", maxWidth: 1000, fontSize: 72, lineHeight: 1.02, fontWeight: 700, letterSpacing: "-3px" }}>
          {title}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, color: "#B0B1AA", fontSize: 24 }}>
          <span style={{ width: 64, height: 5, borderRadius: 5, background: "#DDF527" }} />
          Contenido visual preparado para cada canal
        </div>
      </div>
    ),
    ogSize,
  );
}

