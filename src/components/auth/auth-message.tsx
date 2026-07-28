import type { AuthActionState } from "@/lib/auth/action-state";

export function AuthMessage({ state }: { state: AuthActionState }) {
  if (!state.message) return null;

  return (
    <div
      role={state.status === "error" ? "alert" : "status"}
      aria-live="polite"
      className={`rounded-[0.7rem] border px-4 py-3 text-sm leading-6 ${
        state.status === "error"
          ? "border-red-400/25 bg-red-400/[0.07] text-red-200"
          : "border-brand/25 bg-brand/[0.06] text-white/82"
      }`}
    >
      {state.message}
    </div>
  );
}
