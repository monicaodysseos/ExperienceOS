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
    "bg-blue-500 text-white shadow-playful hover:shadow-playful-hover focus-visible:ring-blue-500 font-bold",
  secondary:
    "bg-orange-500 text-white shadow-playful hover:shadow-playful-hover focus-visible:ring-orange-500 font-bold",
  tertiary:
    "bg-green-500 text-white shadow-playful hover:shadow-playful-hover focus-visible:ring-green-500 font-bold",
  outline:
    "bg-white text-navy-900 shadow-playful hover:shadow-playful-hover focus-visible:ring-navy-900 font-bold",
  ghost:
    "text-navy-900 hover:bg-purple-100 font-bold",
  danger:
    "bg-red-500 text-white shadow-playful hover:shadow-playful-hover focus-visible:ring-red-500 font-bold",
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
