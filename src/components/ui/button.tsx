import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg" | "icon";

const base =
  "inline-flex items-center justify-center gap-2 rounded-lg font-semibold whitespace-nowrap " +
  "transition-[background-color,color,border-color,box-shadow,transform] duration-200 " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand " +
  "disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] " +
  "[&_svg]:shrink-0 [&_svg]:size-[1.125em]";

const variants: Record<Variant, string> = {
  primary: "bg-brand text-brand-contrast shadow-subtle hover:bg-brand-strong",
  secondary: "bg-surface-2 text-ink hover:bg-line",
  outline: "border border-line-strong bg-surface text-ink hover:border-brand hover:text-brand-strong",
  ghost: "text-ink-muted hover:bg-surface-2 hover:text-ink",
  danger: "bg-danger text-white hover:opacity-90",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-11 px-5 text-[0.9375rem]",
  lg: "h-13 px-7 text-base",
  icon: "size-10",
};

export function buttonStyles({
  variant = "primary",
  size = "md",
  className,
}: { variant?: Variant; size?: Size; className?: string } = {}) {
  return cn(base, variants[variant], sizes[size], className);
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

export function Button({ variant, size, className, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={buttonStyles({ variant, size, className })} {...props} />;
}
