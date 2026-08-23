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

const TIME_UNIT_PATTERN =
  "segundos?|minutos?|horas?|d[ií]as?|semanas?|mes(?:es)?|a(?:ñ|n)os?";

function explicitDurationPhrase(source: string) {
  const match = source.match(
    new RegExp(`\\b(\\d+|un|una)\\s+(${TIME_UNIT_PATTERN})\\b`, "i"),
  );
  return match ? `${match[1]} ${match[2]}` : "";
}

export function hasIncompleteThumbnailQuantity(
  candidate: string,
  source: string,
) {
  const duration = explicitDurationPhrase(source);
  if (!duration) return false;
  const [amount, unit] = tokens(duration);
  const candidateTokens = tokens(candidate);
  const normalizedCandidate = candidateTokens.map(normalizeForComparison);
  const amountIndex = normalizedCandidate.lastIndexOf(normalizeForComparison(amount));
  if (amountIndex < 0) return false;
  const following = candidateTokens[amountIndex + 1];
  return !following || normalizeForComparison(following) !== normalizeForComparison(unit);
}

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

function explicitlyEmphasizedPhrase(source: string) {
  const sourceTokens = tokens(source);
  if (sourceTokens.length < 2) return "";
  const emphasized = sourceTokens
    .map((token, index) => ({ token, index }))
    .filter(({ token }) => /[A-ZÁÉÍÓÚÜÑ]/.test(token) && token.length > 2 && token === token.toLocaleUpperCase("es"));
  if (!emphasized.length || emphasized.length >= Math.ceil(sourceTokens.length / 2)) return "";

  const last = emphasized.at(-1)!;
  let start = last.index;
  while (start > 0 && emphasized.some(({ index }) => index === start - 1)) start -= 1;
  if (start === last.index && start > 0) {
    const connector = normalizeForComparison(sourceTokens[start - 1]);
    if (["USANDO", "MEDIANTE", "CON"].includes(connector) && start > 1) {
      return `${sourceTokens[start - 2]} CON ${last.token}`.toLocaleUpperCase("es");
    }
    start -= 1;
  }
  return sourceTokens.slice(start, last.index + 1).join(" ").toLocaleUpperCase("es");
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
  const impactPhrase = explicitlyEmphasizedPhrase(source);
  if (impactPhrase && !isGenericThumbnailText(impactPhrase)) return impactPhrase;
  const durationPhrase = explicitDurationPhrase(source);
  if (durationPhrase) return durationPhrase.toLocaleUpperCase("es");
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
