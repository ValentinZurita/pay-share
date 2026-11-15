import type { SVGProps } from "react";
import { cn } from "@/lib/cn";

type IconProps = SVGProps<SVGSVGElement>;

function IconBase({
  sizeClassName = "h-5 w-5",
  className,
  children,
  ...props
}: IconProps & { sizeClassName?: string }) {
  return (
    <svg
      className={cn(
        sizeClassName,
        "fill-none stroke-current stroke-2 [stroke-linecap:round] [stroke-linejoin:round]",
        className,
      )}
      viewBox="0 0 24 24"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function IconMore(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="6" cy="12" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="18" cy="12" r="1.6" fill="currentColor" stroke="none" />
    </IconBase>
  );
}

export function IconClose(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </IconBase>
  );
}

export function IconBack(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M15 5l-7 7 7 7" />
    </IconBase>
  );
}

export function IconGo(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M9 5l7 7-7 7" />
    </IconBase>
  );
}

export function IconCheck(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </IconBase>
  );
}

export function IconLogo({ className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={cn("h-5 w-5", className)} {...props} aria-hidden="true">
      <path d="M11 3.5a8.5 8.5 0 0 0 0 17z" fill="currentColor" />
      <path d="M13.5 3.9a8.5 8.5 0 0 1 0 16.2z" fill="currentColor" opacity="0.6" />
    </svg>
  );
}

export function IconLock(props: IconProps) {
  return (
    <IconBase sizeClassName="h-4 w-4" {...props}>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </IconBase>
  );
}

export function IconPhone(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="7" y="3" width="10" height="18" rx="2.5" />
      <path d="M11 17.5h2" />
    </IconBase>
  );
}

export function IconQr(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="4" y="4" width="6" height="6" rx="1" />
      <rect x="14" y="4" width="6" height="6" rx="1" />
      <rect x="4" y="14" width="6" height="6" rx="1" />
      <path d="M14 14h2v2M20 14v6h-6v-2" />
    </IconBase>
  );
}

export function IconReceipt(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" />
      <path d="M9 8h6M9 12h6" />
    </IconBase>
  );
}
