"use client"

import { useState } from "react"
import { Play } from "lucide-react"
import ImageLightbox from "./ImageLightbox"

interface Image {
  id: string
  url: string
}

interface GalleryViewProps {
  images: Image[]
  galleryTitle: string
}

export default function GalleryView({ images, galleryTitle }: GalleryViewProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  return (
    <>
      {/* Gallery Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-2">
        {images?.map((img, i) => (
          <div 
            key={img.id} 
            className="relative aspect-[2/3] group overflow-hidden bg-muted/10 rounded-sm cursor-pointer border border-transparent hover:border-pink-600/50 transition-all"
            onClick={() => setLightboxIndex(i)}
          >
            <img 
              src={img.url} 
              alt={`${galleryTitle} - image ${i + 1}`}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover"
            />
            
            {/* Special "Slideshow" button on the first image */}
            {i === 0 && (
              <div className="absolute z-10">
                <button 
                  onClick={(e) => { 
                    e.stopPropagation();
                    setLightboxIndex(0);
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 bg-black/60 hover:bg-pink-600 text-white text-xs font-black rounded border border-white/20 backdrop-blur-md transition-all uppercase tracking-tighter shadow-xl"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Slideshow
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox Overlay */}
      {lightboxIndex !== null && (
        <ImageLightbox
          images={images}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          galleryTitle={galleryTitle}
        />
      )}
    </>
  )
}
