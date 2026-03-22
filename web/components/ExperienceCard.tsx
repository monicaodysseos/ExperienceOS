"use client";

import Link from "next/link";
import Image from "next/image";
import { Star, Clock, MapPin } from "lucide-react";
import { Badge } from "./ui/Badge";
import type { ExperienceListItem } from "@/lib/api";

interface ExperienceCardProps {
  experience: ExperienceListItem;
}

// Category → Color mapping based on VIVI DO design
const getCategoryColors = (categorySlug: string) => {
  const colors: Record<string, { badge: string, border: string, hover: string }> = {
    workshops: { badge: "bg-orange-100 text-orange-700", border: "border-l-orange-500", hover: "group-hover:text-orange-600" },
    tours: { badge: "bg-blue-100 text-blue-700", border: "border-l-blue-500", hover: "group-hover:text-blue-600" },
    wellness: { badge: "bg-purple-100 text-purple-700", border: "border-l-purple-500", hover: "group-hover:text-purple-600" },
    "food-drink": { badge: "bg-red-100 text-red-700", border: "border-l-red-500", hover: "group-hover:text-red-600" },
    outdoor: { badge: "bg-green-100 text-green-700", border: "border-l-green-500", hover: "group-hover:text-green-600" },
    nightlife: { badge: "bg-dark-green-100 text-dark-green-700", border: "border-l-dark-green-500", hover: "group-hover:text-dark-green-600" },
    learning: { badge: "bg-yellow-100 text-yellow-700", border: "border-l-yellow-500", hover: "group-hover:text-yellow-600" },
    arts: { badge: "bg-light-green-100 text-light-green-700", border: "border-l-light-green-500", hover: "group-hover:text-light-green-600" },
    music: { badge: "bg-purple-100 text-purple-700", border: "border-l-purple-500", hover: "group-hover:text-purple-600" },
    games: { badge: "bg-blue-100 text-blue-700", border: "border-l-blue-500", hover: "group-hover:text-blue-600" },
  };
  return colors[categorySlug] || { badge: "bg-blue-100 text-blue-700", border: "border-l-blue-500", hover: "group-hover:text-blue-600" };
};

export function ExperienceCard({ experience: exp }: ExperienceCardProps) {
  const categoryColors = getCategoryColors(exp.category.slug);

  return (
    <Link
      href={`/experiences/${exp.slug}`}
      className={`group block overflow-hidden rounded-[2rem] border-4 ${categoryColors.border} border-navy-900 bg-white transition-all duration-300 hover:shadow-playful-hover hover:-translate-y-2 shadow-playful`}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-navy-100">
        {exp.cover_image ? (
          <Image
            src={exp.cover_image}
            alt={exp.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-navy-300">
            <MapPin className="h-12 w-12" />
          </div>
        )}
        <div className="absolute top-3 left-3">
          <Badge className={`backdrop-blur-sm ${categoryColors.badge}`}>
            {exp.category.name}
          </Badge>
        </div>
      </div>

      {/* Details */}
      <div className="p-5">
        <h3 className={`font-display text-xl font-bold text-navy-900 line-clamp-1 transition-colors ${categoryColors.hover}`}>
          {exp.title}
        </h3>
        <p className="mt-0.5 text-sm text-navy-500">
          by {exp.provider_name}
        </p>

        <div className="mt-3 flex items-center gap-3 text-xs text-navy-500">
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 text-navy-400" />
            {exp.city}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-navy-400" />
            {exp.duration_minutes >= 60
              ? `${Math.floor(exp.duration_minutes / 60)}h${exp.duration_minutes % 60 ? ` ${exp.duration_minutes % 60}m` : ""}`
              : `${exp.duration_minutes}m`}
          </span>
          {exp.review_count > 0 && (
            <span className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-orange-400 text-orange-400" />
              {parseFloat(exp.average_rating).toFixed(1)}
              <span className="text-navy-400">({exp.review_count})</span>
            </span>
          )}
        </div>

        <div className="mt-3 flex items-baseline gap-1">
          <span className="text-lg font-bold text-navy-900">
            &euro;{parseFloat(exp.price_per_person).toFixed(0)}
          </span>
          <span className="text-sm text-navy-500">/ person</span>
        </div>
      </div>
    </Link>
  );
}
