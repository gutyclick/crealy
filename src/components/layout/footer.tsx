import { Container } from "@/components/layout/container";
import { Logo } from "@/components/ui/logo";

const footerGroups = [
  {
    title: "Producto",
    links: [
      { label: "Cómo funciona", href: "/#how-it-works" },
      { label: "Ejemplos", href: "/#examples" },
      { label: "Precios", href: "/pricing" },
      { label: "Herramientas", href: "/tools" },
    ],
  },
  {
    title: "Compañía",
    links: [
      { label: "Centro de ayuda", href: "/help" },
      { label: "Contacto", href: "/contact" },
      { label: "Estado", href: "/status" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacidad", href: "/privacy" },
      { label: "Términos", href: "/terms" },
      { label: "Cookies", href: "/cookies" },
      { label: "Uso aceptable", href: "/acceptable-use" },
      { label: "Reembolsos", href: "/refund-policy" },
    ],
  },
] as const;

export function Footer() {
  return (
    <footer className="border-t border-white/[0.07] bg-surface/45">
      <Container className="grid gap-12 py-16 text-center sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr] lg:text-left">
        <div className="flex flex-col items-center lg:items-start">
          <Logo />
          <p className="mt-5 max-w-xs text-sm leading-6 text-muted">
            Una ruta clara desde tu idea hasta contenido visual preparado para
            cada canal.
          </p>
        </div>

        {footerGroups.map((group) => (
          <nav key={group.title} aria-label={group.title}>
            <p className="text-sm font-semibold text-foreground">
              {group.title}
            </p>
            <div className="mt-4 grid justify-items-center gap-3 lg:justify-items-start">
              {group.links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="inline-flex min-h-11 w-fit items-center py-2 text-sm text-muted transition-colors hover:text-foreground"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </nav>
        ))}

      </Container>

      <Container className="flex flex-col items-center gap-3 border-t border-white/[0.07] py-6 text-center text-sm text-muted sm:flex-row sm:justify-between sm:text-left">
        <span>
          © {new Date().getFullYear()} Crealy. Todos los derechos reservados.
        </span>
        <span>Creación visual con inteligencia artificial</span>
      </Container>
    </footer>
  );
}
