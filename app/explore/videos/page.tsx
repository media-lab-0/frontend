"use client"

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import { Loader2, Play, Eye, Clock, Grid3X3, Users, Flame } from 'lucide-react'

type ViewMode = 'feed' | 'categories' | 'pornstars'

function VideosPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const urlCategory = searchParams.get('category') || ''
  const urlPornstar = searchParams.get('pornstar') || ''
  const urlQuery = searchParams.get('q') || ''

  const [videos, setVideos] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [pornstars, setPornstars] = useState<any[]>([])
  
  const [activeCategory, setActiveCategory] = useState(urlCategory)
  const [activePornstar, setActivePornstar] = useState(urlPornstar)
  const [submittedQuery, setSubmittedQuery] = useState(urlQuery)
  
  // Default to feed but switch view gracefully
  const [viewMode, setViewMode] = useState<ViewMode>(
    (urlCategory || urlPornstar || urlQuery) ? 'feed' : 'feed'
  )

  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const loaderRef = useRef<HTMLDivElement>(null)

  // Sync URL params to local state
  useEffect(() => {
    const cat = searchParams.get('category') || ''
    const ps = searchParams.get('pornstar') || ''
    const q = searchParams.get('q') || ''

    setActiveCategory(cat)
    setActivePornstar(ps)
    setSubmittedQuery(q)

    if (cat || ps || q) {
      setViewMode('feed')
    }
  }, [searchParams])

  // Fetch categories (initially)
  useEffect(() => {
    if (viewMode !== 'categories') return
    setIsLoading(true)
    fetch('/api/videos?source=letsjerktv&mode=categories&page=1')
      .then(res => res.json())
      .then(data => {
        setCategories(data.categories || [])
        setHasMore(data.hasMore ?? false)
      })
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [viewMode])

  // Build fetch URL for videos
  const buildUrl = useCallback((p: number) => {
    const params = new URLSearchParams()
    params.append('source', 'letsjerktv')
    params.append('page', p.toString())
    if (submittedQuery) params.append('q', submittedQuery)
    if (activeCategory) params.append('category', activeCategory)
    if (activePornstar) params.append('pornstar', activePornstar)
    return `/api/videos?${params.toString()}`
  }, [submittedQuery, activeCategory, activePornstar])

  // Fetch videos on filter change
  useEffect(() => {
    if (viewMode === 'categories' || viewMode === 'pornstars') return
    
    setIsLoading(true)
    setVideos([])
    setPage(1)
    setHasMore(true)

    fetch(buildUrl(1))
      .then(res => res.json())
      .then(data => {
        setVideos(data.videos || [])
        setHasMore(data.hasMore ?? false)
      })
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [submittedQuery, activeCategory, activePornstar, viewMode, buildUrl])

  // Fetch pornstars when viewing pornstars tab
  useEffect(() => {
    if (viewMode !== 'pornstars') return
    setIsLoading(true)
    fetch('/api/videos?source=letsjerktv&mode=pornstars&page=1')
      .then(res => res.json())
      .then(data => {
        setPornstars(data.pornstars || [])
        setHasMore(data.hasMore ?? false)
      })
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [viewMode])

  // Load more
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return
    setIsLoadingMore(true)
    const nextPage = page + 1

    if (viewMode === 'pornstars') {
      try {
        const res = await fetch(`/api/videos?source=letsjerktv&mode=pornstars&page=${nextPage}`)
        const data = await res.json()
        if (data.pornstars?.length > 0) {
          setPornstars(prev => [...prev, ...data.pornstars])
          setPage(nextPage)
          setHasMore(data.hasMore ?? false)
        } else {
          setHasMore(false)
        }
      } catch { setHasMore(false) }
      finally { setIsLoadingMore(false) }
      return
    }

    if (viewMode === 'categories') {
      try {
        const res = await fetch(`/api/videos?source=letsjerktv&mode=categories&page=${nextPage}`)
        const data = await res.json()
        if (data.categories?.length > 0) {
          setCategories(prev => [...prev, ...data.categories])
          setPage(nextPage)
          setHasMore(data.hasMore ?? false)
        } else {
          setHasMore(false)
        }
      } catch { setHasMore(false) }
      finally { setIsLoadingMore(false) }
      return
    }

    try {
      const res = await fetch(buildUrl(nextPage))
      const data = await res.json()
      if (data.videos?.length > 0) {
        setVideos(prev => [...prev, ...data.videos])
        setPage(nextPage)
        setHasMore(data.hasMore ?? false)
      } else {
        setHasMore(false)
      }
    } catch { setHasMore(false) }
    finally { setIsLoadingMore(false) }
  }, [page, hasMore, isLoadingMore, buildUrl, viewMode])

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



  // Click category
  const handleCategoryClick = (cat: any) => {
    const slug = cat.slug || cat.name || cat
    router.push(`/explore/videos?category=${encodeURIComponent(slug)}`)
  }

  // Click pornstar
  const handlePornstarClick = (ps: any) => {
    const slug = ps.slug || ps.name || ps
    setActivePornstar(slug)
    setActiveCategory('')
    setSubmittedQuery('')
    setViewMode('feed')
  }

  return (
    <div className="flex-1 flex flex-col w-full max-w-[1600px] mx-auto px-2 md:px-4 py-6 bg-background min-h-screen">
      
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6 px-2">
        <div className="flex items-center justify-between">
          {(activeCategory || activePornstar || submittedQuery) && (
            <button 
              onClick={() => { setActiveCategory(''); setActivePornstar(''); setSubmittedQuery(''); }}
              className="text-[10px] font-bold text-pink-500 hover:text-pink-400 uppercase"
            >
              ✕ Clear filter
            </button>
          )}
        </div>

        {/* Active filter badge */}
        {(activeCategory || activePornstar || submittedQuery) && (
          <div className="text-xs font-bold text-muted-foreground">
            Showing: <span className="text-pink-500">{activeCategory || activePornstar || `"${submittedQuery}"`}</span>
          </div>
        )}

        {/* View Mode Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => { setViewMode('feed'); setActiveCategory(''); setActivePornstar(''); setSubmittedQuery(''); }}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded text-[11px] font-black uppercase transition-all ${
              viewMode === 'feed' && !activeCategory && !activePornstar
                ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-lg'
                : 'bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-muted/20'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            Feed
          </button>
          <button
            onClick={() => setViewMode('categories')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded text-[11px] font-black uppercase transition-all ${
              viewMode === 'categories'
                ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg'
                : 'bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-muted/20'
            }`}
          >
            <Grid3X3 className="w-3.5 h-3.5" />
            Categories
          </button>
          <button
            onClick={() => setViewMode('pornstars')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded text-[11px] font-black uppercase transition-all ${
              viewMode === 'pornstars'
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg'
                : 'bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-muted/20'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Pornstars
          </button>
        </div>
      </div>

      {/* ─── CATEGORIES VIEW ─── */}
      {viewMode === 'categories' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 px-2">
          {categories.map((cat: any, i: number) => {
            const name = cat.name || cat.title || cat;
            const slug = cat.slug || cat.name || cat;
            const thumb = cat.thumbnail || cat.image || cat.thumb || null;
            return (
              <button
                key={`cat-${i}`}
                onClick={() => handleCategoryClick(cat)}
                className="group relative aspect-video rounded-lg overflow-hidden border border-muted/10 hover:border-pink-500/30 transition-all"
              >
                {thumb ? (
                  <img src={thumb} alt={name} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-900/40 to-black flex items-center justify-center">
                    <Grid3X3 className="w-8 h-8 text-white/15" />
                  </div>
                )}
                <div className="absolute inset-0 " />
                <div className="absolute top-2 left-2 z-10 text-left max-w-[65%]">
                  <span className="text-white font-black text-[13px] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] uppercase tracking-wide line-clamp-2 leading-tight">
                    {typeof name === 'string' ? name : JSON.stringify(name)}
                  </span>
                </div>
                {cat.count && Number(cat.count) > 0 && (
                  <div className="absolute top-2 right-2 px-2 py-1 bg-black/80 backdrop-blur-md rounded-md text-[10px] font-black text-white/90 shadow-xl border border-white/10 z-10">
                    {Number(cat.count).toLocaleString()} VIDEOS
                  </div>
                )}
              </button>
            )
          })}
          {categories.length === 0 && !isLoading && (
            <div className="col-span-full py-20 text-center text-muted-foreground">
              No categories found.
            </div>
          )}
        </div>
      )}

      {/* ─── PORNSTARS VIEW ─── */}
      {viewMode === 'pornstars' && (
        <>
          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 px-2">
              {pornstars.map((ps: any, i: number) => {
                const name = ps.name || ps.title || ps;
                const thumb = ps.thumbnail || ps.image || ps.thumb || ps.photo || null;
                const videoCount = ps.videos || ps.video_count || 0;
                return (
                  <button
                    key={`ps-${i}`}
                    onClick={() => handlePornstarClick(ps)}
                    className="group flex flex-col bg-muted/10 hover:bg-muted/20 rounded-lg overflow-hidden border border-transparent hover:border-pink-500/20 transition-all"
                  >
                    <div className="relative aspect-[3/4] bg-muted/20 overflow-hidden">
                      {thumb ? (
                        <img src={thumb} alt={name} className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-900/30 to-black">
                          <Users className="w-10 h-10 text-white/15" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-0.5 p-2.5">
                      <span className="text-[12px] font-bold text-foreground/80 truncate">
                        {typeof name === 'string' ? name : JSON.stringify(name)}
                      </span>
                      {videoCount > 0 && (
                        <span className="text-[9px] text-muted-foreground font-medium">
                          {videoCount} videos
                        </span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* ─── VIDEO FEED VIEW ─── */}
      {viewMode === 'feed' && (
        <>
          {/* Loading */}
          {isLoading && (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
            </div>
          )}

          {/* Video Grid */}
          {!isLoading && videos.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-2">
              {videos.map((video, i) => (
                <Link
                  key={`${video.id}-${i}`}
                  href={`/explore/videos/letsjerktv/${video.id || i}?url=${encodeURIComponent(video.url)}`}
                  className="group flex flex-col bg-muted/10 hover:bg-muted/20 rounded-lg overflow-hidden transition-all border border-transparent hover:border-muted/20"
                >
                  {/* Thumbnail */}
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
                    
                    {/* Duration badge */}
                    {video.duration && (
                      <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/80 rounded text-[10px] font-bold text-white">
                        {video.duration}
                      </div>
                    )}

                    {/* Play overlay */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                      <div className="w-12 h-12 rounded-full bg-pink-600/90 flex items-center justify-center shadow-xl">
                        <Play className="w-5 h-5 text-white fill-current ml-0.5" />
                      </div>
                    </div>
                  </div>

                  {/* Info */}
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
          )}

          {/* No Results */}
          {!isLoading && videos.length === 0 && (
            <div className="py-20 text-center">
              <Play className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground font-bold text-lg">No videos found</p>
              <p className="text-muted-foreground/60 text-sm mt-2">Try a different search or category.</p>
            </div>
          )}
        </>
      )}

      {/* Infinite Scroll Loader */}
      {hasMore && (videos.length > 0 || pornstars.length > 0 || categories.length > 0) && (
        <div ref={loaderRef} className="mt-8 py-10 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-pink-500" />
        </div>
      )}

      {/* End of results */}
      {!hasMore && (videos.length > 0 || pornstars.length > 0 || categories.length > 0) && (
        <div className="mt-8 py-6 flex flex-col items-center gap-1 border-t border-muted/20">
          <p className="text-muted-foreground text-xs font-medium">End of results</p>
        </div>
      )}
    </div>
  )
}

export default function VideosPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center flex-1 items-center min-h-screen">
        <Loader2 className="w-10 h-10 animate-spin text-pink-500" />
      </div>
    }>
      <VideosPageContent />
    </Suspense>
  )
}
