import Link from "next/link";
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from "react";

import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary";
type ButtonSize = "sm" | "md" | "lg";

type SharedProps = {
  children: ReactNode;
  className?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
};

type LinkButtonProps = SharedProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "className" | "href"> & {
    href: string;
  };

type NativeButtonProps = SharedProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> & {
    href?: never;
  };

export type ButtonProps = LinkButtonProps | NativeButtonProps;

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border-transparent bg-brand text-brand-ink shadow-[0_12px_36px_rgba(221,245,39,0.12)] hover:bg-[var(--brand-hover)] hover:-translate-y-0.5 active:translate-y-0",
  secondary:
    "border-[var(--border-strong)] bg-white/[0.025] text-foreground hover:border-white/30 hover:bg-white/[0.055]",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-[0.8rem]",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-[0.92rem] sm:h-13 sm:px-7",
};

export function Button({
  children,
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  const styles = cn(
    "inline-flex shrink-0 items-center justify-center gap-2 rounded-[0.7rem] border font-semibold transition-[background-color,border-color,color,transform] duration-200 ease-out active:scale-[0.97] disabled:pointer-events-none disabled:opacity-45",
    variantClasses[variant],
    sizeClasses[size],
    className,
  );

  if ("href" in props && typeof props.href === "string") {
    const { href, ...linkProps } = props;

    return (
      <Link href={href} className={styles} {...linkProps}>
        {children}
      </Link>
    );
  }

  return (
    <button className={styles} {...props}>
      {children}
    </button>
  );
}
