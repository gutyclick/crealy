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
                  className="w-fit text-sm text-muted transition-colors hover:text-foreground"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </nav>
        ))}

        <div>
          <p className="text-sm font-semibold text-foreground">Estado</p>
          <p className="mt-4 text-sm leading-6 text-muted">
            Área privada disponible. Generación y facturación en desarrollo.
          </p>
          <p className="mt-5 text-xs leading-5 text-white/55">
            Privacidad y términos se publicarán antes del lanzamiento.
          </p>
        </div>
      </Container>

      <Container className="flex flex-col items-center gap-3 border-t border-white/[0.07] py-6 text-center text-sm text-muted sm:flex-row sm:justify-between sm:text-left">
        <span>
          © {new Date().getFullYear()} Crealy. Todos los derechos reservados.
        </span>
        <span>Producto en desarrollo</span>
      </Container>
    </footer>
  );
}
