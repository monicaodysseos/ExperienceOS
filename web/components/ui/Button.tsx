"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Spinner } from "./Spinner";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "tertiary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

const variantStyles = {
  primary:
    "bg-blue-600 text-white shadow-sm hover:shadow-md hover:bg-blue-700 hover:-translate-y-0.5 focus-visible:ring-blue-500",
  secondary:
    "bg-orange-500 text-white shadow-sm hover:shadow-md hover:bg-orange-600 hover:-translate-y-0.5 focus-visible:ring-orange-500",
  tertiary:
    "bg-green-600 text-white shadow-sm hover:shadow-md hover:bg-green-700 hover:-translate-y-0.5 focus-visible:ring-green-500",
  outline:
    "bg-white text-blue-700 shadow-sm ring-2 ring-inset ring-blue-600 hover:bg-blue-50 hover:shadow-md hover:ring-blue-700 focus-visible:ring-blue-500",
  ghost:
    "text-navy-900 hover:bg-blue-50",
  danger:
    "bg-red-600 text-white shadow-sm hover:bg-red-700 hover:shadow-md hover:-translate-y-0.5 focus-visible:ring-red-500",
};

const sizeStyles = {
  sm: "px-3 py-1.5 text-sm rounded-full",
  md: "px-6 py-2.5 text-base rounded-full",
  lg: "px-8 py-4 text-lg rounded-full",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Spinner size="sm" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
