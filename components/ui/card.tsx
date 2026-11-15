import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export type CardVariant = "elevated" | "bordered" | "dashed";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
}

const CARD_VARIANTS: Record<CardVariant, string> = {
  elevated: "bg-surface rounded-xl shadow-card",
  bordered: "bg-surface rounded-xl border border-line",
  dashed: "bg-surface rounded-2xl border border-dashed border-line-strong",
};

/**
 * Surface container for grouped content, bills, forms, and summary blocks.
 */
export function Card({ variant = "elevated", className, ...props }: CardProps) {
  return <div className={cn(CARD_VARIANTS[variant], className)} {...props} />;
}

export interface KeyValueItem {
  label: string;
  value: ReactNode;
  accent?: "default" | "warn";
}

/**
 * Divided key-value summary card used for payment breakdowns and totals.
 */
export function KeyValueList({
  items,
  variant = "elevated",
  className,
}: {
  items: KeyValueItem[];
  variant?: CardVariant;
  className?: string;
}) {
  return (
    <Card variant={variant} className={cn("px-4 py-0.5", className)}>
      {items.map((item, index) => (
        <div
          key={item.label}
          className={cn(
            "flex justify-between gap-3 py-3 text-[14.5px]",
            index > 0 && "border-t border-line",
          )}
        >
          <span>{item.label}</span>
          <span
            className={cn(
              "font-medium num",
              item.accent === "warn" ? "text-warn" : "text-ink",
            )}
          >
            {item.value}
          </span>
        </div>
      ))}
    </Card>
  );
}
