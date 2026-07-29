import { ArrowUpRight, History } from "lucide-react";
import Link from "next/link";

import type { RecentEditSession } from "@/types/editing";

export function RecentEditSessions({
  sessions,
  title = "Ediciones recientes",
  description = "Retoma una conversación sin perder ninguna versión.",
}: {
  sessions: RecentEditSession[];
  title?: string;
  description?: string;
}) {
  if (!sessions.length) return null;

  return (
    <section aria-labelledby="recent-edits-title" className="mt-12">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h2 id="recent-edits-title" className="text-xl font-semibold">
            {title}
          </h2>
          <p className="mt-1 text-sm text-muted">
            {description}
          </p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {sessions.map((session) => (
          <Link
            key={session.id}
            href={`/edit/${session.id}`}
            className="group overflow-hidden rounded-2xl border border-white/10 bg-surface transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-white/20"
          >
            <div className="grid aspect-[4/3] place-items-center overflow-hidden bg-[#050505]">
              {session.imageUrl ? (
                // Signed Supabase URL.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={session.imageUrl}
                  alt=""
                  className="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.025]"
                />
              ) : (
                <History aria-hidden="true" className="size-6 text-white/30" />
              )}
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="line-clamp-1 font-semibold text-foreground">
                  {session.title}
                </h3>
                <ArrowUpRight
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-muted"
                />
              </div>
              <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-muted">
                {session.latestInstruction || "Imagen original lista para editar."}
              </p>
              <p className="mt-4 text-xs text-white/55">
                {session.versionCount}{" "}
                {session.versionCount === 1 ? "versión" : "versiones"}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
