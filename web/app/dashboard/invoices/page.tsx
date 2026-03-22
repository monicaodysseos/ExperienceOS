"use client";

import { useEffect, useState } from "react";
import { FileText, Calendar, Building2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { api, type Invoice } from "@/lib/api";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { InvoiceDownloadButton } from "@/components/InvoiceDownloadButton";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getOrgInvoices()
      .then((data) => setInvoices(data.results || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-8 space-y-4">
        <Skeleton className="h-8 w-40 rounded-lg" />
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="font-display text-4xl font-black text-navy-900 title-shadow">Invoices</h1>
      <p className="mt-2 text-lg font-bold text-navy-500">
        B2B invoices for all team bookings
        {invoices.length > 0 && (
          <span className="ml-2 text-navy-400">({invoices.length} total)</span>
        )}
      </p>

      <div className="mt-6">
        {invoices.length === 0 ? (
          <EmptyState
            icon={<FileText className="h-7 w-7" />}
            title="No invoices yet"
            description="Invoices are generated automatically after each confirmed booking."
          />
        ) : (
          <div className="rounded-[2.5rem] bg-white border-4 border-navy-900 shadow-playful overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 border-b-4 border-navy-900 bg-yellow-400 px-6 py-4 text-xs font-black uppercase tracking-wide text-navy-900">
              <span>Invoice</span>
              <span className="w-32 text-right">Experience</span>
              <span className="w-28 text-right">Date</span>
              <span className="w-24 text-right">Total</span>
              <span className="w-16 text-center">PDF</span>
            </div>

            <div className="divide-y-2 divide-navy-100">
              {invoices.map((inv) => (
                <div
                  key={inv.id}
                  className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-4 px-6 py-5 hover:bg-navy-50 transition-colors"
                >
                  <div>
                    <p className="font-mono text-sm font-medium text-navy-900">
                      {inv.invoice_number}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-navy-400">
                      <Building2 className="h-3 w-3" />
                      {inv.billing_name}
                    </p>
                  </div>

                  <div className="w-32 text-right">
                    <p className="text-sm text-navy-700 truncate max-w-[128px] text-right">
                      {inv.experience_title}
                    </p>
                    <p className="text-xs text-navy-400">{inv.booking_reference}</p>
                  </div>

                  <div className="w-28 text-right">
                    <p className="flex items-center justify-end gap-1 text-sm text-navy-600">
                      <Calendar className="h-3.5 w-3.5 text-navy-400" />
                      {format(parseISO(inv.issued_at), "d MMM yyyy")}
                    </p>
                  </div>

                  <div className="w-24 text-right">
                    <p className="font-semibold text-navy-900">
                      €{parseFloat(inv.total_with_vat).toFixed(2)}
                    </p>
                    <p className="text-xs text-navy-400">
                      incl. {(parseFloat(inv.vat_rate) * 100).toFixed(0)}% VAT
                    </p>
                  </div>

                  <div className="w-16 flex justify-center">
                    <InvoiceDownloadButton
                      invoiceNumber={inv.invoice_number}
                      variant="icon"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {invoices.length > 0 && (
        <div className="mt-6 rounded-xl bg-sand-50 px-5 py-4 text-sm text-navy-500">
          <p>
            Invoices are issued in EUR and include VAT at the applicable rate.
            Contact{" "}
            <a href="mailto:billing@experienceos.com" className="text-teal-600 hover:underline">
              billing@experienceos.com
            </a>{" "}
            for billing queries.
          </p>
        </div>
      )}
    </div>
  );
}
