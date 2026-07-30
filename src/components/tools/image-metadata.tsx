import { formatBytes, simplifiedRatio } from "@/lib/tools/local-image";
import type { LocalImage } from "@/types/tools";

export function ImageMetadata({ image }: { image: LocalImage }) {
  const items = [
    ["Dimensiones", `${image.width} × ${image.height} px`],
    ["Proporción", simplifiedRatio(image.width, image.height)],
    ["Peso", formatBytes(image.bytes)],
    ["Formato", image.mimeType.replace("image/", "").toUpperCase()],
  ];

  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-white/[0.08] sm:grid-cols-4">
      {items.map(([label, value]) => (
        <div key={label} className="bg-[#10110e] p-4">
          <dt className="text-xs text-muted">{label}</dt>
          <dd className="mt-1 text-sm font-semibold text-foreground">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
