import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Buttons are square-cornered, letterspaced and small. There is exactly one
 * filled button on any given screen; everything else is a hairline outline or
 * a plain underlined link.
 */

type Variant = "solid" | "outline" | "quiet" | "ghost";
type Size = "sm" | "md" | "lg";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-none font-medium uppercase tracking-[0.16em] transition-colors duration-[240ms] ease-[cubic-bezier(0.22,0.61,0.36,1)] disabled:pointer-events-none disabled:opacity-40";

const VARIANTS: Record<Variant, string> = {
  solid: "bg-ink text-paper hover:bg-terracotta-deep",
  outline: "border border-ink text-ink hover:bg-ink hover:text-paper",
  quiet: "border border-stone text-ink hover:border-ink",
  ghost: "text-ink hover:text-terracotta",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 px-4 text-[0.625rem]",
  md: "h-11 px-6 text-[0.6875rem]",
  lg: "h-14 px-9 text-[0.75rem]",
};

export function buttonClasses(variant: Variant = "solid", size: Size = "md", className?: string) {
  return cn(BASE, VARIANTS[variant], SIZES[size], className);
}

interface ButtonProps extends ComponentPropsWithoutRef<"button"> {
  variant?: Variant;
  size?: Size;
}

export function Button({ variant = "solid", size = "md", className, ...props }: ButtonProps) {
  return <button className={buttonClasses(variant, size, className)} {...props} />;
}

interface ButtonLinkProps extends ComponentPropsWithoutRef<typeof Link> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

export function ButtonLink({
  variant = "solid",
  size = "md",
  className,
  ...props
}: ButtonLinkProps) {
  return <Link className={buttonClasses(variant, size, className)} {...props} />;
}
