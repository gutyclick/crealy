export class ImageProcessingError extends Error {
  constructor(
    public readonly code:
      | "empty_image"
      | "unsupported_image"
      | "invalid_dimensions"
      | "image_too_large",
    message: string,
  ) {
    super(message);
    this.name = "ImageProcessingError";
  }
}

