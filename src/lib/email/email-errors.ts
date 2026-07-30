export class EmailError extends Error {
  constructor(
    public readonly code: string,
    public readonly statusCode: number | null = null,
    message = "No se pudo enviar el correo.",
  ) {
    super(message);
    this.name = "EmailError";
  }
}
