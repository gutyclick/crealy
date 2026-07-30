import { NextResponse } from "next/server";

import { checkImageProvider } from "@/lib/generation/check-image-provider";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const missing = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    "OPENAI_API_KEY",
    "CRON_SECRET",
  ].filter((name) => !process.env[name]?.trim());

  if (
    !process.env.SUPABASE_SECRET_KEY?.trim() &&
    !process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  ) {
    missing.push("SUPABASE_SECRET_KEY");
  }
  if (missing.length) {
    return NextResponse.json(
      { status: "not_ready", checks: { environment: false, database: false } },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin.from("jobs").select("id").limit(1);
    if (error) throw error;
    const imageProvider = await checkImageProvider({ force: true });
    return NextResponse.json(
      {
        status: imageProvider.ok ? "ready" : "not_ready",
        checks: {
          environment: true,
          database: true,
          imageProvider: imageProvider.ok,
        },
        imageProvider: {
          code: imageProvider.code,
          model: imageProvider.model,
        },
      },
      {
        status: imageProvider.ok ? 200 : 503,
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch {
    return NextResponse.json(
      {
        status: "not_ready",
        checks: {
          environment: true,
          database: false,
          imageProvider: false,
        },
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
