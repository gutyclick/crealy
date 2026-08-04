import { signInWithGoogle } from "@/app/(auth)/actions";

export function GoogleAuthButton({ nextPath }: { nextPath: string }) {
  return (
    <form action={signInWithGoogle}>
      <input type="hidden" name="next" value={nextPath} />
      <button
        type="submit"
        className="flex min-h-12 w-full items-center justify-center gap-3 rounded-[var(--radius-control)] border border-white/[0.14] bg-white px-4 text-sm font-semibold text-black transition-[background-color,transform] hover:bg-white/90 active:scale-[0.99]"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5">
          <path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.4a4.6 4.6 0 0 1-2 3v2.5h3.3c1.9-1.8 2.9-4.4 2.9-7.4Z" />
          <path fill="#34A853" d="M12 22c2.7 0 5-.9 6.7-2.4l-3.3-2.5c-.9.6-2.1 1-3.4 1-2.6 0-4.8-1.8-5.6-4.2H3v2.6A10.1 10.1 0 0 0 12 22Z" />
          <path fill="#FBBC05" d="M6.4 13.9a6 6 0 0 1 0-3.8V7.5H3a10.1 10.1 0 0 0 0 9l3.4-2.6Z" />
          <path fill="#EA4335" d="M12 5.9c1.5 0 2.8.5 3.9 1.5l2.9-2.9A9.7 9.7 0 0 0 3 7.5l3.4 2.6C7.2 7.7 9.4 5.9 12 5.9Z" />
        </svg>
        Continuar con Google
      </button>
    </form>
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
