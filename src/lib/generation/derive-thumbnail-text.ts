import type { GenerationInput } from "@/types/generation";

const LEADING_FILLER = new Set([
  "asi", "así", "compre", "compré", "construi", "construí", "descubri",
  "descubrí", "el", "ella", "ellas", "ellos", "encontre", "encontré",
  "fui", "hice", "intente", "intenté", "la", "las", "los", "mi",
  "mis", "pase", "pasé", "probe", "probé", "reaccione", "reaccioné",
  "te", "toda", "todas", "todo", "todos", "un", "una", "unas", "unos",
  "use", "usé", "visite", "visité",
]);

const GENERIC_TEXTS = new Set([
  "QUE PASO", "QUÉ PASÓ", "NO LO CREERAS", "NO LO CREERÁS", "INCREIBLE",
  "INCREÍBLE", "IMPACTANTE", "TIENES QUE VERLO", "TU IDEA",
]);

const HIGH_IMPACT_PATTERNS = [
  /venenos[ao]s?/i,
  /serpientes?/i,
  /tiburones?/i,
  /cocodrilos?/i,
  /arañas?/i,
  /mortales?/i,
  /peligros[ao]s?/i,
  /prohibid[ao]s?/i,
  /explosi[oó]n/i,
  /incendio/i,
  /hurac[aá]n/i,
  /tornado/i,
  /terremoto/i,
  /abandonad[ao]s?/i,
  /secreto/i,
  /récord/i,
  /millon(?:es)?/i,
] as const;

function normalizeForComparison(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function tokens(value: string) {
  return value
    .replace(/[¿?¡!.,:;()[\]{}"']/g, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

function highImpactPhrase(source: string) {
  const sourceTokens = tokens(source);
  if (sourceTokens.length < 2) return "";

  let strongestIndex = -1;
  let strongestScore = -1;
  sourceTokens.forEach((token, index) => {
    const normalized = token.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const patternIndex = HIGH_IMPACT_PATTERNS.findIndex((pattern) => pattern.test(normalized));
    if (patternIndex < 0) return;
    const uppercaseEmphasis = token.length > 2 && token === token.toLocaleUpperCase("es") ? 5 : 0;
    const lateReveal = index / sourceTokens.length;
    const score = HIGH_IMPACT_PATTERNS.length - patternIndex + uppercaseEmphasis + lateReveal;
    if (score > strongestScore) {
      strongestIndex = index;
      strongestScore = score;
    }
  });

  if (strongestIndex < 0) return "";
  const strongest = sourceTokens[strongestIndex]
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const isDescriptor = /^(venenos|mortal|peligros|prohibid|abandonad)/.test(strongest);
  const next = sourceTokens[strongestIndex + 1]
    ?.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const nextIsDescriptor = Boolean(next && /^(venenos|mortal|peligros)/.test(next));
  const start = isDescriptor ? Math.max(0, strongestIndex - 1) : strongestIndex;
  const end = Math.min(sourceTokens.length, strongestIndex + (nextIsDescriptor ? 2 : 1));
  return sourceTokens.slice(start, end).join(" ").toLocaleUpperCase("es");
}

export function isGenericThumbnailText(value: string) {
  return GENERIC_TEXTS.has(normalizeForComparison(value));
}

/**
 * Produces a compact subject phrase from the title instead of manufacturing a
 * reusable clickbait hook. The creative planner can improve it, but this keeps
 * the deterministic fallback useful when that model is unavailable.
 */
export function deriveAutomaticThumbnailText(
  input: Pick<GenerationInput, "videoTitle" | "description">,
) {
  const source = input.videoTitle?.trim() || input.description.trim();
  const impactPhrase = highImpactPhrase(source);
  if (impactPhrase && !isGenericThumbnailText(impactPhrase)) return impactPhrase;
  const phrase = tokens(source);

  while (
    phrase.length > 1 &&
    LEADING_FILLER.has(
      phrase[0].normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(),
    )
  ) {
    phrase.shift();
  }

  const selected = phrase.slice(0, 5).join(" ").toLocaleUpperCase("es");
  if (selected && !isGenericThumbnailText(selected)) return selected;

  const fallback = tokens(input.description).slice(0, 5).join(" ");
  return fallback.toLocaleUpperCase("es") || "NUEVO VIDEO";
}
