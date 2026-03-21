"use client";

import * as SelectPrimitive from "@radix-ui/react-select";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectOption {
  label: string;
  value: string;
}

interface SelectProps {
  options: SelectOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  className?: string;
}

export function Select({
  options,
  value,
  onValueChange,
  placeholder = "Select...",
  label,
  error,
  className,
}: SelectProps) {
  return (
    <div className={cn("w-full", className)}>
      {label && (
        <span className="mb-1.5 block text-sm font-medium text-navy-700">
          {label}
        </span>
      )}
      <SelectPrimitive.Root value={value} onValueChange={onValueChange}>
        <SelectPrimitive.Trigger
          className={cn(
            "inline-flex w-full items-center justify-between rounded-lg border border-navy-200 bg-white px-3.5 py-2.5 text-sm text-navy-900 transition-colors",
            "hover:border-navy-300 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20",
            "data-[placeholder]:text-navy-400",
            error && "border-red-400"
          )}
        >
          <SelectPrimitive.Value placeholder={placeholder} />
          <SelectPrimitive.Icon>
            <ChevronDown className="h-4 w-4 text-navy-400" />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>

        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            className="z-50 overflow-hidden rounded-xl border border-navy-200 bg-white shadow-elevated"
            position="popper"
            sideOffset={4}
          >
            <SelectPrimitive.Viewport className="p-1">
              {options.map((option) => (
                <SelectPrimitive.Item
                  key={option.value}
                  value={option.value}
                  className={cn(
                    "relative flex cursor-pointer select-none items-center rounded-lg px-3 py-2 text-sm text-navy-700 outline-none",
                    "hover:bg-teal-50 hover:text-teal-700",
                    "data-[state=checked]:bg-teal-50 data-[state=checked]:text-teal-700",
                    "focus:bg-teal-50 focus:text-teal-700"
                  )}
                >
                  <SelectPrimitive.ItemText>
                    {option.label}
                  </SelectPrimitive.ItemText>
                  <SelectPrimitive.ItemIndicator className="ml-auto">
                    <Check className="h-4 w-4" />
                  </SelectPrimitive.ItemIndicator>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
      {error && <p className="mt-1.5 text-sm text-red-500">{error}</p>}
    </div>
  );
}
