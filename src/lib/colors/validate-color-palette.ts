import { normalizeHexColor } from "@/lib/colors/normalize-hex-color";

export type PaletteValidation =
  | { success: true; colors: string[] }
  | { success: false; error: string };

export function validateColorPalette(value: unknown): PaletteValidation {
  if (!Array.isArray(value) || value.length < 1 || value.length > 5) {
    return { success: false, error: "Elige entre uno y cinco colores personalizados." };
  }
  const colors: string[] = [];
  for (const entry of value) {
    const normalized =
      typeof entry === "string" ? normalizeHexColor(entry) : null;
    if (!normalized) {
      return { success: false, error: "Usa #RGB o #RRGGBB, por ejemplo #DF2 o #DDF527." };
    }
    if (!colors.includes(normalized)) colors.push(normalized);
  }
  return { success: true, colors };
}

