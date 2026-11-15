import type { InputHTMLAttributes, ReactNode } from "react";
import { ErrorText } from "@/components/ui/text";
import { cn } from "@/lib/cn";

/**
 * Form field wrapper with label, optional right-hand accessory, and error message.
 */
export function Field({
  label,
  htmlFor,
  hint,
  headerEnd,
  error,
  children,
  className,
}: {
  label?: ReactNode;
  htmlFor?: string;
  hint?: ReactNode;
  headerEnd?: ReactNode;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  const labelContent = label ? (
    <>
      {label}
      {hint ? <span className="font-normal text-muted"> {hint}</span> : null}
    </>
  ) : null;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {labelContent || headerEnd ? (
        <div className="flex items-baseline justify-between gap-2">
          {labelContent ? (
            htmlFor ? (
              <label htmlFor={htmlFor} className="text-[13.5px] font-medium text-ink">
                {labelContent}
              </label>
            ) : (
              <span className="text-[13.5px] font-medium text-ink">{labelContent}</span>
            )
          ) : (
            <span />
          )}
          {headerEnd}
        </div>
      ) : null}
      {children}
      {error ? <ErrorText>{error}</ErrorText> : null}
    </div>
  );
}

export interface TextInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "prefix"> {
  invalid?: boolean;
  prefix?: ReactNode;
  suffix?: ReactNode;
  inputClassName?: string;
}

/**
 * Styled input box supporting optional prefix/suffix adornments and invalid state.
 */
export function TextInput({
  invalid = false,
  prefix,
  suffix,
  className,
  inputClassName,
  ...props
}: TextInputProps) {
  return (
    <div
      className={cn(
        "flex h-[50px] items-center gap-2 rounded-lg bg-surface px-3.5 shadow-card transition-shadow focus-within:shadow-focus",
        invalid && "shadow-focus-danger focus-within:shadow-focus-danger",
        className,
      )}
    >
      {prefix ? <span className="text-[17px] text-muted select-none">{prefix}</span> : null}
      <input
        className={cn(
          "min-w-0 flex-1 border-0 bg-transparent p-0 text-[18px] font-semibold tracking-[-0.01em] text-ink shadow-none outline-none placeholder:font-normal placeholder:text-muted placeholder:opacity-70 focus-visible:shadow-none num",
          inputClassName,
        )}
        {...props}
      />
      {suffix ? <span className="text-[12.5px] font-medium text-muted select-none">{suffix}</span> : null}
    </div>
  );
}

/**
 * Specialized MXN currency input with `$` prefix and `MXN` suffix.
 */
export function CurrencyInput(props: Omit<TextInputProps, "prefix" | "suffix">) {
  return <TextInput prefix="$" suffix="MXN" inputMode="decimal" autoComplete="off" placeholder="0.00" {...props} />;
}
