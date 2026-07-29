const SHORT_HEX = /^#([0-9a-f]{3})$/i;
const LONG_HEX = /^#[0-9a-f]{6}$/i;

export function normalizeHexColor(value: string): string | null {
  const clean = value.trim();
  const short = SHORT_HEX.exec(clean);
  if (short) {
    return `#${short[1]
      .split("")
      .map((character) => character.repeat(2))
      .join("")}`.toUpperCase();
  }
  return LONG_HEX.test(clean) ? clean.toUpperCase() : null;
}

