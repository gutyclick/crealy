import type { LocalImage } from "@/types/tools";

export const TOOL_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const TOOL_IMAGE_MAX_BYTES = 8 * 1024 * 1024;

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function simplifiedRatio(width: number, height: number) {
  const gcd = (a: number, b: number): number =>
    b === 0 ? a : gcd(b, a % b);
  const divisor = gcd(width, height);
  return `${Math.round(width / divisor)}:${Math.round(height / divisor)}`;
}

export async function readLocalImage(file: File): Promise<LocalImage> {
  if (!TOOL_IMAGE_TYPES.includes(file.type as (typeof TOOL_IMAGE_TYPES)[number])) {
    throw new Error("Usa una imagen JPG, PNG o WebP.");
  }
  if (file.size > TOOL_IMAGE_MAX_BYTES) {
    throw new Error("La imagen no puede superar 8 MB.");
  }

  const url = URL.createObjectURL(file);
  try {
    const dimensions = await new Promise<{ width: number; height: number }>(
      (resolve, reject) => {
        const image = new Image();
        image.onload = () =>
          resolve({ width: image.naturalWidth, height: image.naturalHeight });
        image.onerror = () => reject(new Error("No pudimos leer la imagen."));
        image.src = url;
      },
    );
    return {
      file,
      url,
      width: dimensions.width,
      height: dimensions.height,
      bytes: file.size,
      mimeType: file.type,
    };
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
}

export async function estimateImageContrast(url: string) {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image();
    element.onload = () => resolve(element);
    element.onerror = () => reject(new Error("contrast_unavailable"));
    element.src = url;
  });
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 36;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("contrast_unavailable");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
  const luminance: number[] = [];
  for (let index = 0; index < pixels.length; index += 4) {
    luminance.push(
      (0.2126 * pixels[index] +
        0.7152 * pixels[index + 1] +
        0.0722 * pixels[index + 2]) /
        255,
    );
  }
  luminance.sort((a, b) => a - b);
  const low = luminance[Math.floor(luminance.length * 0.1)] || 0;
  const high = luminance[Math.floor(luminance.length * 0.9)] || 1;
  return (high + 0.05) / (low + 0.05);
}
