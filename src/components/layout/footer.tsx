import { Container } from "@/components/layout/container";
import { Logo } from "@/components/ui/logo";

export function Footer() {
  return (
    <footer className="border-t border-white/[0.07] bg-surface/55">
      <Container className="flex flex-col gap-6 py-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Logo className="text-sm" />
          <span className="text-sm text-muted">
            © {new Date().getFullYear()} Crealy
          </span>
        </div>
        <span className="text-sm text-muted">Fase 1 · Vista conceptual</span>
      </Container>
    </footer>
  );
}
