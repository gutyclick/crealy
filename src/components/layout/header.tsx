import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { siteConfig } from "@/config/site";

export function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.07] bg-background/88 backdrop-blur-xl">
      <Container className="relative flex h-16 items-center justify-between sm:h-[4.5rem]">
        <Logo />

        <nav
          aria-label="Navegación principal"
          className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 lg:flex"
        >
          {siteConfig.navigation.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-lg px-3.5 py-2 text-sm font-medium text-muted transition-colors hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center">
          <Button href="#product" size="sm" variant="secondary">
            <span className="sm:hidden">Ver</span>
            <span className="hidden sm:inline">Ver concepto</span>
          </Button>
        </div>
      </Container>
    </header>
  );
}
