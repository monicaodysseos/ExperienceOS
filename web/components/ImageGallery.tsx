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
          className="fixed inset-0 z-[100] flex items-center justify-center bg-ink-900/90 backdrop-blur-sm"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            className="absolute top-6 right-6 rounded-full bg-sand-200 border-2 border-ink-900 shadow-playful p-3 text-ink-900 hover:bg-sand-300 transition-colors"
            onClick={() => setLightboxOpen(false)}
          >
            <X className="h-8 w-8" />
          </button>

          {images.length > 1 && (
            <button
              className="absolute left-6 rounded-full bg-sand-200 border-2 border-ink-900 shadow-playful p-4 text-ink-900 hover:bg-sand-300 transition-colors z-[101]"
              onClick={(e) => {
                e.stopPropagation();
                setActiveIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
              }}
            >
              <ChevronLeft className="h-10 w-10" />
            </button>
          )}

          <div
            className="relative flex flex-col items-center max-h-[90vh] max-w-[85vw] w-full h-full justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={images[activeIndex].image_url}
              alt={`${alt} ${activeIndex + 1}`}
              width={1600}
              height={1200}
              className="max-h-[80vh] w-auto max-w-full object-contain rounded-[2rem] border-4 border-ink-900 bg-sand-100 shadow-elevated"
            />
            {images.length > 1 && (
              <div className="mt-6 rounded-full bg-sand-200 border-2 border-ink-900 px-6 py-2 text-lg font-bold text-ink-900 shadow-playful">
                {activeIndex + 1} / {images.length}
              </div>
            )}
          </div>

          {images.length > 1 && (
            <button
              className="absolute right-6 rounded-full bg-sand-200 border-2 border-ink-900 shadow-playful p-4 text-ink-900 hover:bg-sand-300 transition-colors z-[101]"
              onClick={(e) => {
                e.stopPropagation();
                setActiveIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
              }}
            >
              <ChevronRight className="h-10 w-10" />
            </button>
          )}
        </div>
      )}
    </>
  );
}
