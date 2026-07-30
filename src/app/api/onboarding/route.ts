import { NextResponse } from "next/server";

import { getLaunchConfig } from "@/lib/launch/server";
import { createClient } from "@/lib/supabase/server";

const allowedUseCases = new Set([
  "youtube_thumbnail",
  "banners_covers",
  "social_posts",
  "promotional_creatives",
  "explore_formats",
]);
const allowedRoles = new Set([
  "content_creator",
  "youtuber",
  "streamer",
  "community_manager",
  "entrepreneur",
  "agency",
  "business",
  "other",
]);
const actionRoutes: Record<string, string> = {
  youtube_thumbnail: "/create?type=youtube-thumbnail",
  cover: "/create?type=social-cover",
  edit: "/edit",
  tools: "/tools",
  dashboard: "/dashboard",
};

export async function POST(request: Request) {
  if (!getLaunchConfig().onboardingEnabled) {
    return NextResponse.json({ redirectTo: "/dashboard" });
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    primaryUseCases?: unknown;
    userRole?: unknown;
    firstAction?: unknown;
  } | null;
  const primaryUseCases = Array.isArray(body?.primaryUseCases)
    ? [...new Set(body.primaryUseCases)]
        .filter((item): item is string => typeof item === "string")
        .filter((item) => allowedUseCases.has(item))
        .slice(0, 5)
    : [];
  const userRole =
    typeof body?.userRole === "string" && allowedRoles.has(body.userRole)
      ? body.userRole
      : null;
  const firstAction =
    typeof body?.firstAction === "string" && actionRoutes[body.firstAction]
      ? body.firstAction
      : "dashboard";

  const { error } = await supabase.from("user_preferences").upsert({
    user_id: user.id,
    primary_use_cases: primaryUseCases,
    user_role: userRole,
    onboarding_completed_at: new Date().toISOString(),
  });
  if (error) {
    return NextResponse.json({ error: "save_failed" }, { status: 503 });
  }

  return NextResponse.json({ redirectTo: actionRoutes[firstAction] });
}

