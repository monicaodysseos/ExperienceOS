"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";

const SORT_OPTIONS = [
  { label: "Newest", value: "-created_at" },
  { label: "Top Rated", value: "-average_rating" },
  { label: "Price: Low to High", value: "price_per_person" },
  { label: "Price: High to Low", value: "-price_per_person" },
  { label: "Most Popular", value: "-booking_count" },
];

export function SortSelect({ currentValue }: { currentValue?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    if (e.target.value) {
      params.set("ordering", e.target.value);
    } else {
      params.delete("ordering");
    }
    const query = params.toString();
    router.push(`/experiences${query ? `?${query}` : ""}`);
  };

  return (
    <div className="flex items-center gap-2">
      <SlidersHorizontal className="h-4 w-4 text-navy-400" />
      <select
        defaultValue={currentValue || ""}
        className="rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm text-navy-700 focus:border-teal-500 focus:outline-none"
        onChange={handleChange}
      >
        <option value="">Sort by</option>
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
