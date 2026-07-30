export async function readLimitedBody(request: Request, maximumBytes: number) {
  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (declaredLength > maximumBytes) return null;
  if (!request.body) return new Blob([]);

  const reader = request.body.getReader();
  const chunks: Uint8Array<ArrayBuffer>[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maximumBytes) {
      await reader.cancel();
      return null;
    }
    chunks.push(new Uint8Array(value));
  }
  return new Blob(chunks, {
    type: request.headers.get("content-type") || "application/octet-stream",
  });
}
