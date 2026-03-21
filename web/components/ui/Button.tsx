"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Spinner } from "./Spinner";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

const variantStyles = {
  primary:
    "bg-navy-900 text-white shadow-sm hover:shadow-md hover:bg-navy-800 hover:-translate-y-0.5",
  secondary:
    "bg-crimson-600 text-white shadow-sm hover:shadow-md hover:bg-crimson-700 hover:-translate-y-0.5",
  outline:
    "bg-white text-navy-900 shadow-sm ring-1 ring-inset ring-sand-200 hover:bg-sand-50 hover:shadow-md hover:ring-sand-300",
  ghost:
    "text-navy-900 hover:bg-sand-100",
  danger:
    "bg-error text-white shadow-sm hover:bg-red-600 hover:shadow-md hover:-translate-y-0.5",
};

const sizeStyles = {
  sm: "px-3 py-1.5 text-sm rounded-lg",
  md: "px-5 py-2.5 text-base rounded-xl",
  lg: "px-8 py-4 text-lg rounded-2xl",
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
