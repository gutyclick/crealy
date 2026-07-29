import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  compact?: boolean;
};

export function Logo({ className, compact = false }: LogoProps) {
  return (
    <Link
      href="/"
      className={cn(
        "inline-flex shrink-0 items-center",
        className,
      )}
      aria-label="Crealy, página principal"
    >
      <Image
        src={
          compact
            ? "/brand/crealy-favicon.webp"
            : "/brand/crealy-logo-white.svg"
        }
        alt=""
        width={compact ? 200 : 400}
        height={compact ? 200 : 100}
        className={
          compact
            ? "size-7 rounded-[0.4rem]"
            : "h-7 w-auto sm:h-8"
        }
      />
    </Link>
  );
}
