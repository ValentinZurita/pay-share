import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "quiet" | "surface" | "ghost";
export type ButtonSize = "default" | "compact" | "icon" | "icon-sm";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  iconEnd?: ReactNode;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-btn text-on-btn shadow-btn disabled:bg-fill disabled:text-fg3 disabled:shadow-none",
  secondary: "bg-fill text-accent disabled:opacity-50",
  quiet: "bg-transparent text-accent font-medium disabled:opacity-50",
  surface: "bg-fill text-fg",
  ghost: "bg-transparent text-fg2 hover:bg-fill hover:text-fg",
};

function sizeClass(variant: ButtonVariant, size: ButtonSize): string {
  if (size === "icon") return "h-11 w-11 rounded-full shrink-0";
  if (size === "icon-sm") return "h-9 w-9 rounded-full shrink-0";
  if (size === "compact") {
    return "min-h-10 px-3.5 text-[15px] font-semibold tracking-[-0.01em] rounded-full";
  }
  if (variant === "quiet") return "min-h-11 px-4 text-[17px] rounded-full";
  return "min-h-[54px] px-4 text-[17px] font-semibold tracking-[-0.01em] rounded-full";
}

/**
 * Shared pill button with elastic press and the reference variants.
 */
export function Button({
  variant = "primary",
  size = "default",
  fullWidth = size === "default",
  iconEnd,
  className,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "relative inline-flex items-center justify-center gap-2 border-0 transition-transform duration-[250ms] ease-(--ease) select-none active:scale-[0.97] disabled:cursor-default disabled:active:scale-100",
        VARIANT_CLASSES[variant],
        sizeClass(variant, size),
        fullWidth && "w-full",
        className,
      )}
      {...props}
    >
      {children}
      {iconEnd ? (
        <span className="pointer-events-none absolute right-4 inline-flex items-center opacity-75" aria-hidden="true">
          {iconEnd}
        </span>
      ) : null}
    </button>
  );
}
