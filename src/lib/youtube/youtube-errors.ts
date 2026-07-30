export type YouTubeErrorCode =
  | "invalid_url"
  | "invalid_video_id"
  | "invalid_channel"
  | "not_found"
  | "not_configured"
  | "provider_unavailable"
  | "unsafe_source"
  | "file_too_large"
  | "unsupported_media";

export class YouTubeError extends Error {
  constructor(
    public readonly code: YouTubeErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "YouTubeError";
  }
}
