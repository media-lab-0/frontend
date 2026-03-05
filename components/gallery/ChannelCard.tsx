"use client"

import Link from 'next/link'
import { Folder } from 'lucide-react'

interface ChannelCardProps {
  name: string
  slug: string
  imageUrl: string
  galleryCount: number
}

export function ChannelCard({ name, slug, imageUrl, galleryCount }: ChannelCardProps) {
  return (
    <Link 
      href={`/channel/${slug}`}
      className="group relative aspect-[3/4] overflow-hidden bg-muted/20 border border-muted/10"
    >
      {/* Background Image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img 
        src={imageUrl}
        alt={name}
        className="absolute inset-0 w-full h-full object-cover"
        loading="lazy"
      />
      
      {/* Top Overlay (Name and Count) */}
      <div className="absolute inset-x-0 top-0 p-3 bg-gradient-to-b from-black/60 to-transparent flex justify-between items-start z-20">
        <span className="text-white font-bold text-[13px] leading-tight drop-shadow-md truncate max-w-[70%]">
          {name}
        </span>
        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-black/40 backdrop-blur-md rounded text-[11px] font-black text-white/90">
          <Folder className="w-3 h-3 text-pink-500" />
          <span>{galleryCount > 0 ? galleryCount.toLocaleString() : '—'}</span>
        </div>
      </div>

      {/* Hover Effect */}
      <div className="absolute inset-0 bg-pink-600/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10" />
    </Link>
  )
}
