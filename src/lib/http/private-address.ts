function privateIpv4(address: string) {
  const parts = address.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return true;
  const [a, b, c] = parts;
  return a === 0 || a === 10 || a === 127 || a >= 224 ||
    a === 169 && b === 254 || a === 172 && b >= 16 && b <= 31 ||
    a === 192 && b === 168 || a === 100 && b >= 64 && b <= 127 ||
    a === 198 && (b === 18 || b === 19) ||
    a === 192 && b === 0 || a === 198 && b === 51 && c === 100 || a === 203 && b === 0 && c === 113;
}

export function isPrivateAddress(address: string) {
  const normalized = address.toLowerCase().replace(/^\[|\]$/g, "");
  if (normalized.includes(".")) {
    const mapped = normalized.lastIndexOf(":");
    return privateIpv4(mapped >= 0 ? normalized.slice(mapped + 1) : normalized);
  }
  return normalized === "::" || normalized === "::1" || /^f[cd]/.test(normalized) ||
    /^fe[89ab]/.test(normalized) || normalized.startsWith("ff") || normalized.startsWith("2001:db8") ||
    normalized.startsWith("::ffff:");
}
