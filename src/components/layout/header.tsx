import { Container } from "@/components/layout/container";
import { MobileNavigation } from "@/components/layout/mobile-navigation";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { getLaunchStage, isBetaStage } from "@/config/launch";
import { siteConfig } from "@/config/site";

export function Header() {
  const launchStage = getLaunchStage();

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.08] bg-background/82 backdrop-blur-2xl">
      <Container className="relative flex h-16 items-center justify-between sm:h-[4.5rem]">
        <div className="flex items-center gap-2.5">
          <Logo />
          {isBetaStage(launchStage) ? (
            <span className="hidden rounded-full border border-primary/25 bg-primary/10 px-2 py-1 text-[0.625rem] font-bold uppercase tracking-[0.16em] text-primary sm:inline-flex">
              Beta
            </span>
          ) : null}
        </div>

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

        <div className="ml-auto flex min-w-0 items-center gap-2 lg:ml-0">
          <a
            href="/login"
            className="hidden rounded-[0.7rem] px-3 py-2 text-sm font-medium text-muted transition-colors hover:text-foreground xl:inline-flex"
          >
            Iniciar sesión
          </a>
          <Button href="/signup" size="sm" variant="secondary">
            <span className="sm:hidden">Cuenta</span>
            <span className="hidden sm:inline">Crear cuenta</span>
          </Button>
          <MobileNavigation />
        </div>
      </Container>
    </header>
  );
}
