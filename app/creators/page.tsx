"use client"

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { Loader2, Folder } from 'lucide-react'

export default function CreatorsPage() {
  const [creators, setCreators] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const loaderRef = useRef<HTMLDivElement>(null)

  // Initial fetch
  useEffect(() => {
    setIsLoading(true)
    fetch('/api/creators?offset=0&limit=20')
      .then(res => res.json())
      .then(data => {
        setCreators(data.creators || [])
        setOffset(data.creators?.length || 0)
        setHasMore(data.hasMore ?? false)
      })
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [])

  // Load more
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return
    setIsLoadingMore(true)
    try {
      const res = await fetch(`/api/creators?offset=${offset}&limit=20`)
      const data = await res.json()
      if (data.creators && data.creators.length > 0) {
        setCreators(prev => [...prev, ...data.creators])
        setOffset(prev => prev + data.creators.length)
        setHasMore(data.hasMore ?? false)
      } else {
        setHasMore(false)
      }
    } catch {
      setHasMore(false)
    } finally {
      setIsLoadingMore(false)
    }
  }, [offset, hasMore, isLoadingMore])

  // Infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadMore()
        }
      },
      { threshold: 0.1 }
    )
    if (loaderRef.current) observer.observe(loaderRef.current)
    return () => observer.disconnect()
  }, [hasMore, isLoadingMore, loadMore])

  return (
    <div className="flex-1 flex flex-col w-full max-w-[1600px] mx-auto px-2 md:px-4 py-6 bg-background">
      
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6 px-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 via-purple-500 to-orange-500 flex items-center justify-center">
            <span className="text-white font-black text-sm">OF</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground/90 uppercase tracking-tight">OnlyFans Creators</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Exclusive content creators</p>
          </div>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
        </div>
      )}

      {/* Grid */}
      {!isLoading && creators.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1 md:gap-1.5">
          {creators.map((creator, i) => (
            <Link
              key={`${creator.slug}-${i}`}
              href={`/gallery/${creator.slug}`}
              className="group relative aspect-[3/4] overflow-hidden bg-muted/20"
            >
              {creator.image_url ? (
                <img
                  src={creator.image_url}
                  alt={creator.name}
                  className="absolute inset-0 w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-pink-900/30 to-black flex items-center justify-center">
                  <span className="text-3xl font-black text-white/20">{creator.name?.[0]}</span>
                </div>
              )}

              {/* Top overlay — name + OnlyFans badge */}
              <div className="absolute inset-x-0 top-0 p-2.5 bg-gradient-to-b from-black/70 to-transparent flex justify-between items-start">
                <span className="text-white font-bold text-[12px] leading-tight drop-shadow-md truncate max-w-[75%]">
                  {creator.name}
                </span>
                <span className="flex-shrink-0 px-1.5 py-0.5 bg-gradient-to-r from-pink-500 to-orange-500 text-[9px] font-black text-white rounded uppercase">
                  OF
                </span>
              </div>

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-pink-600/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </Link>
          ))}
        </div>
      )}

      {/* Infinite Scroll Loader */}
      {hasMore && creators.length > 0 && (
        <div ref={loaderRef} className="mt-8 py-10 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-pink-500" />
        </div>
      )}

      {/* End of results */}
      {!hasMore && creators.length > 0 && (
        <div className="mt-8 py-6 flex flex-col items-center gap-1 border-t border-muted/20">
          <p className="text-muted-foreground text-xs font-medium">End of results</p>
          <p className="text-muted-foreground/50 text-[10px] uppercase font-bold">Showing {creators.length} creators</p>
        </div>
      )}

      {/* No Results */}
      {!isLoading && creators.length === 0 && (
        <div className="py-20 text-center">
          <Folder className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground font-bold text-lg">No creators found</p>
          <p className="text-muted-foreground/60 text-sm mt-2">Check back later for more content.</p>
        </div>
      )}
    </div>
  )
}
