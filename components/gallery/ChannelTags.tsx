"use client"

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface ChannelTagsProps {
  tags: { name: string; slug: string }[]
}

export function ChannelTags({ tags }: ChannelTagsProps) {
  const [expanded, setExpanded] = useState(false)

  if (tags.length === 0) return null

  const COLLAPSED_COUNT = 7
  const visibleTags = expanded ? tags : tags.slice(0, COLLAPSED_COUNT)
  const hasMore = tags.length > COLLAPSED_COUNT

  return (
    <div className="flex flex-wrap items-center gap-2">
      {visibleTags.map((tag, i) => (
        <Link
          key={`rel-${i}`}
          href={`/search?q=${encodeURIComponent(tag.name)}`}
          className="px-4 py-1.5 bg-muted/40 hover:bg-pink-500/20 text-foreground/80 hover:text-pink-500 border border-muted/30 hover:border-pink-500/30 rounded-sm transition-all text-[12px] font-bold"
        >
          {tag.name}
        </Link>
      ))}
      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-8 h-8 flex items-center justify-center bg-muted/40 hover:bg-muted/60 border border-muted/30 rounded-sm transition-all text-muted-foreground hover:text-foreground"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      )}
    </div>
  )
}
