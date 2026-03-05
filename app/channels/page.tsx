"use client"

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef, useCallback } from 'react'
import { Zap, Loader2 } from "lucide-react"
import { ChannelFilters } from '@/components/gallery/ChannelFilters'
import { ChannelCard } from '@/components/gallery/ChannelCard'

const PAGE_SIZE = 20;

export default function ChannelsPage() {
  const [activeFilters, setActiveFilters] = useState<any>({})
  const [networks, setNetworks] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [channels, setChannels] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const loaderRef = useRef<HTMLDivElement>(null)

  // Fetch filter data
  useEffect(() => {
    fetch('/api/channels/filters')
      .then(res => res.json())
      .then(data => {
        if (data.networks) setNetworks(data.networks);
        if (data.categories) setCategories(data.categories);
      })
      .catch(console.error)
  }, [])

  // Build params from filters
  const buildParams = useCallback((off: number) => {
    const params = new URLSearchParams()
    params.append('offset', off.toString())
    params.append('limit', PAGE_SIZE.toString())
    if (activeFilters.alphabet) params.append('alphabet', activeFilters.alphabet.slug)
    if (activeFilters.category) params.append('category', activeFilters.category.slug)
    return params.toString()
  }, [activeFilters])

  // Initial fetch + filter changes
  useEffect(() => {
    setIsLoading(true)
    setChannels([])
    setOffset(0)
    setHasMore(true)

    fetch(`/api/channels?${buildParams(0)}`)
      .then(res => res.json())
      .then(data => {
        setChannels(data.channels || [])
        setOffset(data.channels?.length || 0)
        setHasMore(data.hasMore ?? false)
      })
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [activeFilters.alphabet, activeFilters.category, buildParams])

  // Load more
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return
    setIsLoadingMore(true)
    try {
      const res = await fetch(`/api/channels?${buildParams(offset)}`)
      const data = await res.json()
      if (data.channels && data.channels.length > 0) {
        setChannels(prev => [...prev, ...data.channels])
        setOffset(prev => prev + data.channels.length)
        setHasMore(data.hasMore ?? false)
      } else {
        setHasMore(false)
      }
    } catch {
      setHasMore(false)
    } finally {
      setIsLoadingMore(false)
    }
  }, [offset, hasMore, isLoadingMore, buildParams])

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

  const handleReset = () => {
    setActiveFilters({})
  }

  const handleFilterChange = (newFilters: any) => {
    if (newFilters.network) {
      window.location.href = `/channel/${newFilters.network.slug}`
      return
    }
    setActiveFilters(newFilters)
  }

  return (
    <div className="flex flex-col w-full max-w-[1600px] mx-auto px-4 md:px-8 py-8 bg-background min-h-screen">
      {/* Filters */}
      <ChannelFilters 
        activeFilters={activeFilters}
        onFilterChange={handleFilterChange}
        onReset={handleReset}
        networks={networks}
        categories={categories}
      />

      {/* Main Content */}
      <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-muted/20 pb-4">
              <h2 className="text-sm font-black uppercase tracking-widest text-foreground/80">
                  {activeFilters.alphabet ? `Sites Starting With: ${activeFilters.alphabet.name}` : 'Most Popular Channels'}
              </h2>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">
                  <Zap className="w-3 h-3 text-pink-500" />
                  {channels.length} Networks Found
              </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20">
               <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {channels.map((chan, i) => (
                <ChannelCard 
                  key={`${chan.slug}-${i}`}
                  name={chan.name}
                  slug={chan.slug}
                  imageUrl={chan.image_url}
                  galleryCount={chan.gallery_count}
                />
              ))}
            </div>
          )}

          {/* Infinite Scroll Loader */}
          {hasMore && channels.length > 0 && (
            <div ref={loaderRef} className="mt-4 py-8 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-pink-500" />
            </div>
          )}

          {/* End of results */}
          {!hasMore && channels.length > 0 && (
            <div className="mt-4 py-6 flex flex-col items-center gap-1 border-t border-muted/20">
              <p className="text-muted-foreground text-xs font-medium">End of results</p>
              <p className="text-muted-foreground/50 text-[10px] uppercase font-bold">Showing {channels.length} channels</p>
            </div>
          )}

          {!isLoading && channels.length === 0 && (
            <div className="py-20 text-center text-muted-foreground italic">
              No channels found matching your filters.
            </div>
          )}
      </div>
    </div>
  )
}
