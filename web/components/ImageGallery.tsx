"use client";

import { useState } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface GalleryImage {
  id: number;
  image_url: string;
  is_cover: boolean;
}

interface ImageGalleryProps {
  images: GalleryImage[];
  alt: string;
}

export function ImageGallery({ images, alt }: ImageGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="aspect-[16/9] flex items-center justify-center rounded-2xl bg-navy-100 text-navy-300">
        <span className="text-lg">No images available</span>
      </div>
    );
  }

  const mainImage = images[0];
  const thumbnails = images.slice(1, 5);
  const hasMore = images.length > 5;

  return (
    <>
      <div className="grid gap-2 rounded-2xl overflow-hidden">
        {images.length === 1 ? (
          <button
            onClick={() => { setActiveIndex(0); setLightboxOpen(true); }}
            className="relative aspect-[16/9] cursor-pointer"
          >
            <Image
              src={mainImage.image_url}
              alt={alt}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 66vw"
              priority
            />
          </button>
        ) : (
          <div className="grid grid-cols-4 grid-rows-2 gap-2 aspect-[2/1]">
            <button
              onClick={() => { setActiveIndex(0); setLightboxOpen(true); }}
              className="relative col-span-2 row-span-2 cursor-pointer overflow-hidden rounded-l-2xl"
            >
              <Image
                src={mainImage.image_url}
                alt={alt}
                fill
                className="object-cover hover:scale-105 transition-transform duration-300"
                sizes="50vw"
                priority
              />
            </button>
            {thumbnails.map((img, i) => (
              <button
                key={img.id}
                onClick={() => { setActiveIndex(i + 1); setLightboxOpen(true); }}
                className={cn(
                  "relative cursor-pointer overflow-hidden",
                  i === 1 && "rounded-tr-2xl",
                  i === 3 && "rounded-br-2xl"
                )}
              >
                <Image
                  src={img.image_url}
                  alt={`${alt} ${i + 2}`}
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-300"
                  sizes="25vw"
                />
                {i === thumbnails.length - 1 && hasMore && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white text-sm font-medium">
                    +{images.length - 5} more
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
            onClick={() => setLightboxOpen(false)}
          >
            <X className="h-6 w-6" />
          </button>

          <button
            className="absolute left-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setActiveIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
            }}
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          <div
            className="relative max-h-[80vh] max-w-[90vw]"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={images[activeIndex].image_url}
              alt={`${alt} ${activeIndex + 1}`}
              width={1200}
              height={800}
              className="max-h-[80vh] w-auto object-contain rounded-lg"
            />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-sm text-white">
              {activeIndex + 1} / {images.length}
            </div>
          </div>

          <button
            className="absolute right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setActiveIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
            }}
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>
      )}
    </>
  );
}
