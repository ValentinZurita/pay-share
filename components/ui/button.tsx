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
    "bg-primary text-on-primary shadow-btn hover:-translate-y-[0.5px] hover:bg-primary-press disabled:bg-primary-mid disabled:shadow-none disabled:cursor-default disabled:hover:translate-y-0 disabled:active:scale-100",
  secondary:
    "bg-surface text-ink shadow-card hover:-translate-y-[0.5px] hover:shadow-card-hover disabled:opacity-60 disabled:cursor-default disabled:hover:translate-y-0 disabled:active:scale-100",
  quiet:
    "bg-transparent text-muted font-medium shadow-none hover:bg-bg/70 hover:text-ink disabled:opacity-50 disabled:cursor-default",
  surface:
    "bg-surface text-ink shadow-card hover:-translate-y-[0.5px] hover:shadow-card-hover",
  ghost:
    "bg-transparent text-muted hover:bg-bg hover:text-ink",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  default: "min-h-12 px-4 text-[16px] font-semibold tracking-[-0.01em] rounded-lg",
  compact: "min-h-10 px-3.5 text-[14px] font-semibold tracking-[-0.01em] rounded-lg",
  icon: "w-11 h-11 rounded-lg shrink-0",
  "icon-sm": "w-9 h-9 rounded-lg shrink-0",
};

/**
 * Shared button primitive with consistent sizing, focus rings, and variants.
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
        "relative inline-flex items-center justify-center gap-2 transition-[background,box-shadow,transform,color] duration-150 ease-(--ease) active:scale-[0.985] select-none",
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        fullWidth && "w-full",
        className,
      )}
      {...props}
    >
      {children}
      {iconEnd ? (
        <span className="absolute right-4 inline-flex items-center opacity-75" aria-hidden="true">
          {iconEnd}
        </span>
      ) : null}
    </button>
  );
}
