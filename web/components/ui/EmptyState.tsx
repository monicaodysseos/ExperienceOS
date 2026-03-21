import { cn } from "@/lib/utils";
import { Button } from "./Button";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center py-16 text-center", className)}>
      {icon && (
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-navy-100 text-navy-400">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-navy-900">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-navy-500">{description}</p>
      {action && (
        <div className="mt-6">
          {action.href ? (
            <a href={action.href}>
              <Button variant="primary">{action.label}</Button>
            </a>
          ) : (
            <Button variant="primary" onClick={action.onClick}>
              {action.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
