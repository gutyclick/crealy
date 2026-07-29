import type {
  GenerationFormat,
  GenerationQuality,
} from "@/types/generation";

type ImageQuality = "low" | "high";

const FORMAT_OUTPUTS: Record<
  GenerationFormat,
  {
    size: string;
    width: number;
    height: number;
    aspectRatio: string;
    safeArea: string;
  }
> = {
  "youtube-16-9": {
    size: "1920x1088",
    width: 1920,
    height: 1080,
    aspectRatio: "16 / 9",
    safeArea: "Mantén texto y rostros dentro del 80% central.",
  },
  "social-square": {
    size: "1024x1024",
    width: 1024,
    height: 1024,
    aspectRatio: "1 / 1",
    safeArea: "Deja un margen interior del 8% para texto y logotipos.",
  },
  "social-portrait": {
    size: "1024x1280",
    width: 1024,
    height: 1280,
    aspectRatio: "4 / 5",
    safeArea: "Mantén el mensaje principal dentro del 84% central.",
  },
  "banner-3-1": {
    size: "1536x512",
    width: 1536,
    height: 512,
    aspectRatio: "3 / 1",
    safeArea: "Reserva los extremos para fondos, no para información esencial.",
  },
  "facebook-cover": {
    size: "1712x640",
    width: 1702,
    height: 630,
    aspectRatio: "851 / 315",
    safeArea:
      "Mantén texto y rostros en el centro; la foto de perfil cubre parte del lado izquierdo y Facebook puede recortar según la pantalla.",
  },
  "x-cover": {
    size: "1536x512",
    width: 1500,
    height: 500,
    aspectRatio: "3 / 1",
    safeArea:
      "Mantén información esencial en el centro y libre del círculo de perfil en la esquina inferior izquierda.",
  },
  "linkedin-cover": {
    size: "1536x512",
    width: 1584,
    height: 396,
    aspectRatio: "4 / 1",
    safeArea:
      "Compón todos los elementos esenciales dentro de una franja horizontal central; evita el extremo inferior izquierdo por la foto de perfil.",
  },
  "social-cover-panorama": {
    size: "1536x640",
    width: 1536,
    height: 640,
    aspectRatio: "12 / 5",
    safeArea: "Mantén la información esencial en la zona central.",
  },
};

const QUALITY_OUTPUTS: Record<GenerationQuality, ImageQuality> = {
  fast: "low",
  high: "high",
};

export function mapGenerationOptions(
  format: GenerationFormat,
  quality: GenerationQuality,
) {
  return {
    ...FORMAT_OUTPUTS[format],
    finalSize: `${FORMAT_OUTPUTS[format].width}x${FORMAT_OUTPUTS[format].height}`,
    quality:
      format === "youtube-16-9" ||
      format === "banner-3-1" ||
      format === "facebook-cover" ||
      format === "x-cover" ||
      format === "linkedin-cover"
        ? ("high" as const)
        : QUALITY_OUTPUTS[quality],
    outputFormat: "png" as const,
    mimeType: "image/png" as const,
    extension: "png" as const,
  };
}
