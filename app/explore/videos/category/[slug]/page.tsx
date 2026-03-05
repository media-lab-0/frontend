"use client"

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
import { useState, useEffect, useRef, useCallback, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2, Play, Eye, Clock, ArrowLeft } from 'lucide-react'

export default function CategoryVideosPage({ params }: { params: Promise<{ slug: string }> }) {
  const router = useRouter()
  // React 19 / Next 15 pattern for unwrapping params
  const unwrappedParams = use(params)
  // Decode the URL slug (e.g. "1080p" or "big%20tits")
  const categorySlug = decodeURIComponent(unwrappedParams.slug)

  const [videos, setVideos] = useState<any[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const loaderRef = useRef<HTMLDivElement>(null)

  // Initial fetch
  useEffect(() => {
    setIsLoading(true)
    fetch(`/api/videos?source=letsjerktv&category=${encodeURIComponent(categorySlug)}&page=1`)
      .then(res => res.json())
      .then(data => {
        setVideos(data.videos || [])
        setHasMore(data.hasMore ?? false)
      })
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [categorySlug])

  // Load more
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return
    setIsLoadingMore(true)
    const nextPage = page + 1
    
    try {
      const res = await fetch(`/api/videos?source=letsjerktv&category=${encodeURIComponent(categorySlug)}&page=${nextPage}`)
      const data = await res.json()
      if (data.videos?.length > 0) {
        setVideos(prev => [...prev, ...data.videos])
        setPage(nextPage)
        setHasMore(data.hasMore ?? false)
      } else {
        setHasMore(false)
      }
    } catch { 
      setHasMore(false) 
    } finally { 
      setIsLoadingMore(false) 
    }
  }, [page, hasMore, isLoadingMore, categorySlug])

  // Infinite scroll observer
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
    <div className="flex-1 flex flex-col w-full max-w-[1600px] mx-auto px-2 md:px-4 py-6 bg-background min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6 px-2">
        <button 
          onClick={() => router.back()}
          className="p-2 -ml-2 rounded-full hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-black uppercase tracking-tight text-foreground/90">
            {categorySlug} Videos
          </h1>
          <p className="text-xs font-bold text-muted-foreground">
            Browsing category
          </p>
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex justify-center flex-1 items-center min-h-[50vh]">
          <Loader2 className="w-10 h-10 animate-spin text-pink-500" />
        </div>
      ) : (
        <>
          {/* Video Grid */}
          {videos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-2">
              {videos.map((video, i) => (
                <Link
                  key={`${video.id}-${i}`}
                  href={`/explore/videos/letsjerktv/${video.id || i}?url=${encodeURIComponent(video.url)}`}
                  className="group flex flex-col bg-muted/10 hover:bg-muted/20 rounded-lg overflow-hidden transition-all border border-transparent hover:border-muted/20"
                >
                  <div className="relative aspect-video bg-muted/20 overflow-hidden">
                    {video.thumbnail ? (
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
                        <Play className="w-10 h-10 text-white/20" />
                      </div>
                    )}
                    
                    {video.duration && (
                      <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/80 rounded text-[10px] font-bold text-white">
                        {video.duration}
                      </div>
                    )}

                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                      <div className="w-12 h-12 rounded-full bg-pink-600/90 flex items-center justify-center shadow-xl">
                        <Play className="w-5 h-5 text-white fill-current ml-0.5" />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 p-3">
                    <h3 className="text-[13px] font-bold text-foreground/90 leading-tight line-clamp-2">
                      {video.title}
                    </h3>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-medium mt-1">
                      {video.views > 0 && (
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {typeof video.views === 'number' ? video.views.toLocaleString() : video.views}
                        </span>
                      )}
                      {video.rating > 0 && (
                        <span>⭐ {video.rating}%</span>
                      )}
                      {video.added && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {video.added}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center">
              <Play className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground font-bold text-lg">No videos found</p>
              <p className="text-muted-foreground/60 text-sm mt-2">Try a different category.</p>
            </div>
          )}
        </>
      )}

      {/* Infinite Scroll Loader */}
      {hasMore && videos.length > 0 && (
        <div ref={loaderRef} className="mt-8 py-10 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-pink-500" />
        </div>
      )}

      {/* End of results */}
      {!hasMore && videos.length > 0 && (
        <div className="mt-8 py-6 flex flex-col items-center gap-1 border-t border-muted/20">
          <p className="text-muted-foreground text-xs font-medium">End of results</p>
        </div>
      )}
    </div>
  )
}
