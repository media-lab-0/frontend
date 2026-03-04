"use client"

import { useState, useEffect } from 'react'
import { Globe, Zap, Loader2 } from "lucide-react"
import { ChannelFilters } from '@/components/gallery/ChannelFilters'
import { ChannelCard } from '@/components/gallery/ChannelCard'

export default function ChannelsPage() {
  const [activeFilters, setActiveFilters] = useState<any>({})
  const [networks, setNetworks] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [channels, setChannels] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // 1. Fetch filter data for dropdowns
    fetch('/api/channels/filters')
      .then(res => res.json())
      .then(data => {
        if (data.networks) setNetworks(data.networks);
        if (data.categories) setCategories(data.categories);
      })
      .catch(console.error)
  }, [])

  useEffect(() => {
    // 2. Fetch channel cards based on active filters
    setIsLoading(true)
    const params = new URLSearchParams()
    if (activeFilters.alphabet) params.append('alphabet', activeFilters.alphabet.slug)
    // Category mapping to channels isn't fully implemented in DB yet, but we'll send it
    if (activeFilters.category) params.append('category', activeFilters.category.slug)

    fetch(`/api/channels?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        setChannels(data.channels || [])
      })
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [activeFilters.alphabet, activeFilters.category])

  const handleReset = () => {
    setActiveFilters({})
  }

  // If a specific network is selected from the dropdown, navigate directly?
  // Or just filter the grid?
  // User selected "Blacked" in dropdown -> we should probably just show Blacked card.
  // Actually, if they pick a network in dropdown, it's better to just navigate to /channel/[slug]
  const handleFilterChange = (newFilters: any) => {
    if (newFilters.network) {
      // Direct navigation if a single network is picked from dropdown
      window.location.href = `/channel/${newFilters.network.slug}`
      return
    }
    setActiveFilters(newFilters)
  }

  return (
    <div className="flex flex-col w-full max-w-[1600px] mx-auto px-4 md:px-8 py-8 bg-background min-h-screen">
      {/* Header */}
      <div className="flex flex-col gap-2 mb-8">
        <div className="flex items-center gap-3 text-pink-500 mb-2">
            <Globe className="w-6 h-6" />
            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight">Channel Directory</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl font-medium text-sm">
          Browse our curated list of top-tier adult sites and networks. Click a channel to view its full gallery collection.
        </p>
      </div>

      {/* Filters */}
      <ChannelFilters 
        activeFilters={activeFilters}
        onFilterChange={handleFilterChange}
        onReset={handleReset}
        networks={networks}
        categories={categories}
      />

      {/* Main Content: Channel Card Grid */}
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
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {channels.map((chan) => (
                <ChannelCard 
                  key={chan.slug}
                  name={chan.name}
                  slug={chan.slug}
                  imageUrl={chan.image_url}
                  galleryCount={chan.gallery_count}
                />
              ))}
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
