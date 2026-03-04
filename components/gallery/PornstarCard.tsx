
"use client"

import Link from 'next/link'
import { Folder } from 'lucide-react'

interface PornstarCardProps {
  name: string;
  image: string;
  galleries: number;
  slug?: string;
}

export function PornstarCard({ name, image, galleries, slug }: PornstarCardProps) {
  const displaySlug = slug || name.toLowerCase().replace(/\s+/g, '-');
  
  return (
    <Link 
      href={`/pornstar/${displaySlug}`}
      className="group relative aspect-[3/4] overflow-hidden bg-muted/20 border border-muted/10"
    >
      {/* Background Image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img 
        src={image}
        alt={name}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        loading="lazy"
      />
      
      {/* Top Overlay (Name and Count) */}
      <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/60 to-transparent flex justify-between items-start">
        <span className="text-white font-bold text-base bg-black/80 backdrop-blur-md drop-shadow-md truncate max-w-[70%]">
          {name}
        </span>
        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-black/80 backdrop-blur-md text-[11px] font-black text-white/90">
          <Folder className="w-3 h-3 text-pink-500" />
          <span>{galleries.toLocaleString()}</span>
        </div>
      </div>
    </Link>
  )
}
