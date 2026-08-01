import "server-only";

function configuredDays(name: string, fallback: number) {
  const value = Number(process.env[name] || fallback);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export function getUploadedFileRetentionDays() {
  return configuredDays("UPLOADED_FILE_RETENTION_DAYS", 7);
}

export function getCreatedAssetRetentionDays(planKey?: string | null) {
  switch (planKey) {
    case "creator":
      return configuredDays("CREATOR_ASSET_RETENTION_DAYS", 30);
    case "pro":
    case "business":
      return configuredDays("PRO_ASSET_RETENTION_DAYS", 90);
    case "starter":
      return configuredDays("STARTER_ASSET_RETENTION_DAYS", 7);
    default:
      return configuredDays("FREE_ASSET_RETENTION_DAYS", 7);
  }
}

