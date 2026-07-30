import { AlertTriangle, CheckCircle2 } from "lucide-react";

export function ImageWarnings({ warnings }: { warnings: string[] }) {
  const ok = warnings.length === 0;
  return (
    <div
      className={`flex gap-3 rounded-xl p-4 text-sm leading-6 ${
        ok ? "bg-brand/[0.08] text-white/80" : "bg-amber-300/[0.08] text-amber-100"
      }`}
    >
      {ok ? (
        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden />
      ) : (
        <AlertTriangle
          className="mt-0.5 size-5 shrink-0 text-amber-300"
          aria-hidden
        />
      )}
      <div>
        {ok ? (
          <p>Las medidas principales se ven bien para esta vista.</p>
        ) : (
          <ul className="grid gap-1">
            {warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
