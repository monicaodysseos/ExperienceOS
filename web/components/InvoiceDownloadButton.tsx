"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface InvoiceDownloadButtonProps {
  invoiceNumber: string;
  className?: string;
  variant?: "button" | "icon";
}

export function InvoiceDownloadButton({
  invoiceNumber,
  className,
  variant = "button",
}: InvoiceDownloadButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const blob = await api.downloadInvoice(invoiceNumber);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to download invoice");
    } finally {
      setLoading(false);
    }
  };

  if (variant === "icon") {
    return (
      <button
        onClick={handleDownload}
        disabled={loading}
        title="Download PDF"
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-lg text-navy-500 transition-colors hover:bg-navy-50 hover:text-navy-900 disabled:opacity-50",
          className
        )}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className={cn(
        "flex items-center gap-1.5 rounded-lg border border-navy-200 bg-white px-3 py-1.5 text-sm font-medium text-navy-700 transition-colors hover:bg-navy-50 disabled:opacity-50",
        className
      )}
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Download className="h-3.5 w-3.5" />
      )}
      PDF
    </button>
  );
}
