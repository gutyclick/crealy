"use client";

import { useFormStatus } from "react-dom";

import {
  signInWithDiscord,
  signInWithGoogle,
} from "@/app/(auth)/actions";

type SocialAuthButtonsProps = {
  nextPath: string;
  flow: "login" | "signup";
  inviteCode?: string;
  inviteRequired?: boolean;
  termsAccepted?: boolean;
  marketingOptIn?: boolean;
  googleEnabled?: boolean;
  discordEnabled?: boolean;
  provider?: "google" | "discord";
};

function ProviderButton({
  provider,
  disabled = false,
}: {
  provider: "google" | "discord";
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  const isGoogle = provider === "google";

  return (
    <button
      type="submit"
      disabled={pending || disabled}
      aria-label={`Continuar con ${isGoogle ? "Google" : "Discord"}`}
      className="flex min-h-12 w-full items-center justify-center gap-3 rounded-[var(--radius-control)] border border-white/[0.14] bg-white/[0.035] px-4 text-sm font-semibold text-foreground transition-[background-color,border-color,transform] hover:border-white/25 hover:bg-white/[0.07] active:scale-[0.99] disabled:cursor-wait disabled:opacity-55"
    >
      {isGoogle ? <GoogleMark /> : <DiscordMark />}
      {pending
        ? "Conectando…"
        : `Continuar con ${isGoogle ? "Google" : "Discord"}`}
    </button>
  );
}

export function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 shrink-0">
      <path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.4a4.6 4.6 0 0 1-2 3v2.5h3.3c1.9-1.8 2.9-4.4 2.9-7.4Z" />
      <path fill="#34A853" d="M12 22c2.7 0 5-.9 6.7-2.4l-3.3-2.5c-.9.6-2.1 1-3.4 1-2.6 0-4.8-1.8-5.6-4.2H3v2.6A10.1 10.1 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.4 13.9a6 6 0 0 1 0-3.8V7.5H3a10.1 10.1 0 0 0 0 9l3.4-2.6Z" />
      <path fill="#EA4335" d="M12 5.9c1.5 0 2.8.5 3.9 1.5l2.9-2.9A9.7 9.7 0 0 0 3 7.5l3.4 2.6C7.2 7.7 9.4 5.9 12 5.9Z" />
    </svg>
  );
}

export function DiscordMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 shrink-0 text-[#5865F2]">
      <path fill="currentColor" d="M19.5 5.3A18 18 0 0 0 15 4l-.6 1.2a16.8 16.8 0 0 0-4.8 0L9 4a18 18 0 0 0-4.5 1.3C1.7 9.5.9 13.6 1.3 17.6A18.4 18.4 0 0 0 6.8 20l1.3-1.8a11.7 11.7 0 0 1-2-1l.5-.4a12.9 12.9 0 0 0 10.8 0l.5.4a12 12 0 0 1-2 1l1.3 1.8a18.4 18.4 0 0 0 5.5-2.4c.5-4.6-.8-8.7-3.2-12.3ZM8.6 15.2c-1.1 0-2-1-2-2.2s.9-2.2 2-2.2 2 1 2 2.2-.9 2.2-2 2.2Zm6.8 0c-1.1 0-2-1-2-2.2s.9-2.2 2-2.2 2 1 2 2.2-.9 2.2-2 2.2Z" />
    </svg>
  );
}

export function SocialAuthButtons({
  nextPath,
  flow,
  inviteCode = "",
  inviteRequired = false,
  termsAccepted = false,
  marketingOptIn = false,
  googleEnabled = false,
  discordEnabled = false,
  provider,
}: SocialAuthButtonsProps) {
  const showGoogle = googleEnabled && (!provider || provider === "google");
  const showDiscord = discordEnabled && (!provider || provider === "discord");
  if (!showGoogle && !showDiscord) return null;
  const inviteReady = !inviteRequired || inviteCode.trim().length >= 12;
  const signupReady = flow === "login" || (inviteReady && termsAccepted);

  return (
    <div className={showGoogle && showDiscord ? "grid gap-3 sm:grid-cols-2" : "grid gap-3"}>
      {showGoogle ? (
        <form action={signInWithGoogle}>
          <input type="hidden" name="next" value={nextPath} />
          <input type="hidden" name="flow" value={flow} />
          {inviteRequired ? <input type="hidden" name="inviteCode" value={inviteCode} /> : null}
          {flow === "signup" ? <input type="hidden" name="termsAccepted" value={termsAccepted ? "on" : ""} /> : null}
          {flow === "signup" ? <input type="hidden" name="marketingOptIn" value={marketingOptIn ? "on" : ""} /> : null}
          <ProviderButton provider="google" disabled={!signupReady} />
        </form>
      ) : null}
      {showDiscord ? (
        <form action={signInWithDiscord}>
          <input type="hidden" name="next" value={nextPath} />
          <input type="hidden" name="flow" value={flow} />
          {inviteRequired ? <input type="hidden" name="inviteCode" value={inviteCode} /> : null}
          {flow === "signup" ? <input type="hidden" name="termsAccepted" value={termsAccepted ? "on" : ""} /> : null}
          {flow === "signup" ? <input type="hidden" name="marketingOptIn" value={marketingOptIn ? "on" : ""} /> : null}
          <ProviderButton provider="discord" disabled={!signupReady} />
        </form>
      ) : null}
    </div>
  );
}

export function AuthDivider() {
  return (
    <div className="flex items-center gap-3" aria-hidden="true">
      <span className="h-px flex-1 bg-white/10" />
      <span className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--text-meta)]">
        o continúa con correo
      </span>
      <span className="h-px flex-1 bg-white/10" />
    </div>
  );
}
