import Link from "next/link";
import Image from "next/image";
import { ExperienceMapItem } from "@/lib/api";

interface MapPopupProps {
  experience: ExperienceMapItem;
  approximate?: boolean;
}

export function MapPopup({ experience, approximate }: MapPopupProps) {
  return (
    <Link
      href={`/experiences/${experience.slug}`}
      className="block w-64 group"
    >
      {experience.cover_image && (
        <div className="relative w-full h-40 bg-sand-200">
          <Image
            src={experience.cover_image}
            alt={experience.title}
            fill
            className="object-cover"
          />
        </div>
      )}
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-navy-900 group-hover:text-crimson-800 transition-colors line-clamp-2">
            {experience.title}
          </h3>
          {experience.average_rating !== "0.00" && (
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-sm">⭐</span>
              <span className="text-sm font-medium text-navy-900">
                {parseFloat(experience.average_rating).toFixed(1)}
              </span>
            </div>
          )}
        </div>
        {approximate && (
          <p className="text-xs text-navy-400 italic">Approximate city location</p>
        )}
        <div className="flex items-center justify-between">
          <p className="text-sm text-navy-600">{experience.city}</p>
          <p className="font-bold text-navy-900">
            {experience.currency === "EUR" ? "€" : "$"}
            {parseFloat(experience.price_per_person).toFixed(0)}
          </p>
        </div>
        <div className="inline-flex items-center gap-1 px-2 py-1 bg-sand-100 rounded text-xs font-medium text-navy-700">
          {experience.category.name}
        </div>
      </div>
    </Link>
  );
}
