import { getContentTypeConfig } from "@/config/generation";
import type { ContentType } from "@/types/generation";

const MAX_TITLE_LENGTH = 60;

export function buildProjectTitle(
  description: string,
  contentType: ContentType,
) {
  const normalized = description.replace(/\s+/g, " ").trim();
  const words = normalized.split(" ").filter(Boolean);
  const meaningful = words.slice(0, 8).join(" ");
  const fallback = getContentTypeConfig(contentType).fullLabel;
  const title = meaningful || fallback;

  if (title.length <= MAX_TITLE_LENGTH) return title;
  return `${title.slice(0, MAX_TITLE_LENGTH - 1).trimEnd()}…`;
}
