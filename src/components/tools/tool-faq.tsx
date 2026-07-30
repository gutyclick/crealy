export type ToolFaqItem = { question: string; answer: string };

export function ToolFaq({ items }: { items: readonly ToolFaqItem[] }) {
  return (
    <section className="mx-auto max-w-[900px] px-5 py-14 sm:px-8">
      <h2 className="text-center text-3xl font-semibold tracking-[-0.03em] text-foreground">
        Preguntas frecuentes
      </h2>
      <div className="mt-8 divide-y divide-white/[0.08] border-y border-white/[0.08]">
        {items.map((item) => (
          <details key={item.question} className="group py-5">
            <summary className="cursor-pointer list-none pr-8 text-base font-semibold text-foreground marker:hidden">
              {item.question}
            </summary>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
              {item.answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
