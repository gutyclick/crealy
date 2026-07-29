export async function readApiResponse<T>(
  response: Response,
  fallbackMessage: string,
): Promise<T> {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    try {
      return (await response.json()) as T;
    } catch {
      throw new Error(
        response.ok
          ? "El servidor devolvió una respuesta incompleta."
          : fallbackMessage,
      );
    }
  }

  const rawText = await response.text().catch(() => "");
  if (
    response.status === 413 ||
    /request entity too large|payload too large/i.test(rawText)
  ) {
    throw new Error(
      "La imagen era demasiado grande para esta ruta. Ya puedes reintentar con la subida directa.",
    );
  }

  throw new Error(fallbackMessage);
}

