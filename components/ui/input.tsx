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
      {hint ? <span className="font-normal text-fg3"> {hint}</span> : null}
    </>
  ) : null;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {labelContent || headerEnd ? (
        <div className="flex items-baseline justify-between gap-2">
          {labelContent ? (
            htmlFor ? (
              <label htmlFor={htmlFor} className="text-[14px] font-medium text-fg2">
                {labelContent}
              </label>
            ) : (
              <span className="text-[14px] font-medium text-fg2">{labelContent}</span>
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
  textSize?: "lg" | "md";
  inputClassName?: string;
}

/**
 * Styled input box supporting optional prefix/suffix adornments and invalid state.
 */
export function TextInput({
  invalid = false,
  prefix,
  suffix,
  textSize = "lg",
  className,
  inputClassName,
  ...props
}: TextInputProps) {
  return (
    <div
      data-invalid={invalid ? "true" : undefined}
      className={cn("ps-field", className)}
    >
      {prefix ? <span className="text-[17px] text-fg3 select-none">{prefix}</span> : null}
      <input
        className={cn(
          "min-w-0 flex-1 border-0 bg-transparent p-0 text-[16px] tracking-[-0.01em] text-fg shadow-none outline-none placeholder:font-normal placeholder:text-fg3 focus-visible:shadow-none num",
          textSize === "md" ? "font-medium" : "font-semibold",
          inputClassName,
        )}
        {...props}
      />
      {suffix ? <span className="text-[12.5px] font-medium text-fg3 select-none">{suffix}</span> : null}
    </div>
  );
}

/**
 * Specialized MXN currency input with `$` prefix and `MXN` suffix.
 */
export function CurrencyInput(props: Omit<TextInputProps, "prefix" | "suffix">) {
  return (
    <TextInput
      type="text"
      prefix="$"
      suffix="MXN"
      inputMode="decimal"
      autoComplete="off"
      autoCorrect="off"
      autoCapitalize="off"
      spellCheck={false}
      placeholder="0.00"
      {...props}
    />
  );
}
