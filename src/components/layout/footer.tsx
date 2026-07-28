import { Container } from "@/components/layout/container";
import { Logo } from "@/components/ui/logo";

const footerGroups = [
  {
    title: "Producto",
    links: [
      { label: "Cómo funciona", href: "#how-it-works" },
      { label: "Ejemplos", href: "#examples" },
      { label: "Precios", href: "#pricing" },
    ],
  },
  {
    title: "Compañía",
    links: [
      { label: "Sobre Crealy", href: "#product" },
      { label: "Contacto", href: "#final-cta" },
    ],
  },
] as const;

export function Footer() {
  return (
    <footer className="border-t border-white/[0.07] bg-surface/45">
      <Container className="grid gap-12 py-14 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-5 max-w-xs text-sm leading-6 text-muted">
            Una ruta simple desde tu idea hasta una pieza visual lista para
            compartir.
          </p>
        </div>

        {footerGroups.map((group) => (
          <nav key={group.title} aria-label={group.title}>
            <p className="text-sm font-semibold text-foreground">
              {group.title}
            </p>
            <div className="mt-4 grid gap-3">
              {group.links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="w-fit text-sm text-muted transition-colors hover:text-foreground"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </nav>
        ))}

        <div>
          <p className="text-sm font-semibold text-foreground">Legal</p>
          <p className="mt-4 text-sm text-muted">Privacidad</p>
          <p className="mt-3 text-sm text-muted">Términos</p>
          <p className="mt-6 text-xs leading-5 text-white/38">
            Documentos disponibles antes del lanzamiento.
          </p>
        </div>
      </Container>

      <Container className="flex flex-col gap-3 border-t border-white/[0.07] py-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <span>
          © {new Date().getFullYear()} Crealy. Todos los derechos reservados.
        </span>
        <span>Producto en desarrollo</span>
      </Container>
    </footer>
  );
}
