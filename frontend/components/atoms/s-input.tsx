import * as React from "react";
import { cn } from "@/lib/cn";

type IconComp = React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;

type Props = {
  defaultValue?: string;
  placeholder?: string;
  type?: string;
  Icon?: IconComp;
  className?: string;
  name?: string;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  disabled?: boolean;
};

export function SInput({
  defaultValue,
  placeholder,
  type = "text",
  Icon,
  className,
  name,
  autoComplete,
  required,
  minLength,
  maxLength,
  disabled,
}: Props) {
  return (
    <label
      className={cn(
        "flex items-center gap-2.5 px-3.5 h-[50px] rounded-[14px] bg-spark-surface border border-spark-border focus-within:border-spark-ink/40 transition-colors",
        className,
      )}
    >
      {Icon && <Icon size={18} strokeWidth={1.7} className="text-spark-ink-50 shrink-0" />}
      <input
        type={type}
        name={name}
        autoComplete={autoComplete}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
        maxLength={maxLength}
        disabled={disabled}
        className="flex-1 border-none outline-none bg-transparent text-[15px] text-spark-ink tracking-[-0.01em] placeholder:text-spark-ink-35 disabled:opacity-60"
      />
    </label>
  );
}
