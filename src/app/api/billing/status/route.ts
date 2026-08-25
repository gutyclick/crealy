import { NextResponse } from "next/server";

import { getUserBillingState } from "@/lib/billing/get-user-billing-state";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const state = await getUserBillingState(user.id);
    return NextResponse.json({
      plan: state.effectivePlan.key,
      status: state.subscription?.status ?? null,
      credits: state.credits.available,
      reservedCredits: state.credits.reserved,
    });
  } catch {
    return NextResponse.json(
      { error: "billing_state_unavailable" },
      { status: 503 },
    );
  }
}
