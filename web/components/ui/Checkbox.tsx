"use client";

import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CheckboxProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  label?: string;
  id?: string;
  className?: string;
  disabled?: boolean;
}

export function Checkbox({
  checked,
  onCheckedChange,
  label,
  id,
  className,
  disabled,
}: CheckboxProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <CheckboxPrimitive.Root
        id={id}
        checked={checked}
        onCheckedChange={(val) => onCheckedChange?.(val === true)}
        disabled={disabled}
        className={cn(
          "flex h-4.5 w-4.5 items-center justify-center rounded border border-navy-300 bg-white transition-colors",
          "hover:border-teal-500",
          "data-[state=checked]:border-teal-700 data-[state=checked]:bg-teal-700",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
        )}
      >
        <CheckboxPrimitive.Indicator>
          <Check className="h-3 w-3 text-white" strokeWidth={3} />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
      {label && (
        <label
          htmlFor={id}
          className="cursor-pointer text-sm text-navy-700 select-none"
        >
          {label}
        </label>
      )}
    </div>
  );
}
