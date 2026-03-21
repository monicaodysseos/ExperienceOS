"use client";

import Link from "next/link";
import Image from "next/image";
import { Star, Clock, MapPin } from "lucide-react";
import { Badge } from "./ui/Badge";
import type { ExperienceListItem } from "@/lib/api";

interface ExperienceCardProps {
  experience: ExperienceListItem;
}

export function ExperienceCard({ experience: exp }: ExperienceCardProps) {
  return (
    <Link
      href={`/experiences/${exp.slug}`}
      className="group block overflow-hidden rounded-xl border border-navy-200 bg-white transition-all duration-300 hover:shadow-elevated hover:-translate-y-1"
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
          <Badge variant="info" className="backdrop-blur-sm bg-white/90 text-teal-700">
            {exp.category.name}
          </Badge>
        </div>
      </div>

      {/* Details */}
      <div className="p-4">
        <h3 className="text-base font-semibold text-navy-900 line-clamp-1 group-hover:text-teal-700 transition-colors">
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
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
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
