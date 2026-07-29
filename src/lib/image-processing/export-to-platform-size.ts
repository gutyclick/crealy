import "server-only";

import type { ExportStrategy } from "@/config/content-formats";
import { inspectImage } from "@/lib/image-processing/inspect-image";
import { resizeWithoutDistortion } from "@/lib/image-processing/resize-without-distortion";

export async function exportToPlatformSize(input: {
  buffer: Buffer;
  width: number;
  height: number;
  strategy: ExportStrategy;
}) {
  const actual = await inspectImage(input.buffer);
  if (actual.width === input.width && actual.height === input.height) {
    return { buffer: input.buffer, adapted: false, source: actual };
  }
  const buffer = await resizeWithoutDistortion(input);
  const exported = await inspectImage(buffer);
  return { buffer, adapted: true, source: actual, exported };
}

