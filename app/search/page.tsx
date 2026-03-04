"use client"

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Search, Loader2, ArrowLeft, Folder, Star, Heart, Share2 } from 'lucide-react'

export default function SearchPage() {
  const searchParams = useSearchParams()
  const query = searchParams.get('q') || ''
  const [results, setResults] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!query) return
    setIsLoading(true)
    fetch(`/api/search?q=${encodeURIComponent(query)}`)
      .then(res => res.json())
      .then(data => setResults(data))
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [query])

  return (
    <div className="flex flex-col w-full max-w-[1600px] mx-auto px-2 md:px-6 py-4 md:py-6 bg-background min-h-screen">
      {/* Back Link */}
      <Link 
        href="/"
        className="inline-flex items-center text-xs font-bold text-muted-foreground hover:text-foreground transition-colors mb-4 uppercase tracking-wider"
      >
        <ArrowLeft className="w-3 h-3 mr-1.5" />
        Back
      </Link>

      {isLoading && (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
        </div>
      )}

      {!isLoading && results && (
        <div className="flex flex-col gap-0">

          {/* Model Profile Header (if model found) */}
          {results.model && (
            <div className="flex flex-col md:flex-row gap-8 mb-8 border-b border-muted/20 pb-8">
              {/* Avatar */}
              <Link 
                href={`/pornstar/${results.model.slug}`}
                className="relative w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-muted/30 shadow-2xl flex-shrink-0 mx-auto md:mx-0 bg-muted/20 hover:border-pink-500/40 transition-all"
              >
                <img 
                  src={results.model.image_url || `https://ui-avatars.com/api/?name=${results.model.name}&background=random&size=256`} 
                  alt={results.model.name}
                  className="w-full h-full object-cover"
                />
              </Link>

              {/* Info Box */}
              <div className="flex-1 flex flex-col justify-center text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                  <Link href={`/pornstar/${results.model.slug}`}>
                    <h1 className="text-3xl md:text-4xl font-black text-foreground/90 uppercase truncate hover:text-pink-500 transition-colors">
                      {results.model.name}
                    </h1>
                  </Link>
                  <div className="flex items-center justify-center md:justify-start gap-2">
                    <button className="p-2 bg-muted/30 hover:bg-muted/50 rounded-full transition-all border border-muted/20">
                      <Heart className="w-5 h-5 text-pink-500" />
                    </button>
                    <button className="p-2 bg-muted/30 hover:bg-muted/50 rounded-full transition-all border border-muted/20">
                      <Share2 className="w-5 h-5 text-muted-foreground" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-sm font-bold text-muted-foreground uppercase tracking-widest">
                  {results.model.age && (
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span>Age: {results.model.age}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Folder className="w-4 h-4 text-pink-500" />
                    <span>{results.model.galleries_count?.toLocaleString() || "0"} Galleries</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Related Models as Tags (only when model found) */}
          {results.relatedModels?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {results.relatedModels.map((m: any, i: number) => (
                <Link
                  key={`related-${i}`}
                  href={`/search?q=${encodeURIComponent(m.name)}`}
                  className="px-3 py-1.5 bg-muted/40 hover:bg-pink-500/20 text-foreground/80 hover:text-pink-500 border border-muted/20 hover:border-pink-500/30 rounded-sm transition-all text-[12px] font-bold"
                >
                  {m.name}
                </Link>
              ))}
            </div>
          )}

          {/* Category/Tag Results (when no model found — keyword/category searches) */}
          {!results.model && (results.categories?.length > 0 || results.channels?.length > 0) && (
            <div className="flex flex-col gap-4 mb-6">
              {/* Header */}
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black uppercase tracking-tight text-foreground/80">
                  Showing results for: <span className="text-pink-500">&quot;{query}&quot;</span>
                </h2>
              </div>

              {/* Related tags */}
              <div className="flex flex-wrap gap-2">
                {results.channels?.map((c: any, i: number) => (
                  <Link
                    key={`chan-${i}`}
                    href={`/channel/${c.slug}`}
                    className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 border border-blue-500/20 rounded-sm transition-all text-[12px] font-bold"
                  >
                    {c.name}
                  </Link>
                ))}
                {results.categories?.map((c: any, i: number) => (
                  <Link
                    key={`cat-${i}`}
                    href={`/tag/${c.slug}`}
                    className="px-3 py-1.5 bg-muted/40 hover:bg-emerald-500/20 text-foreground/80 hover:text-emerald-400 border border-muted/20 hover:border-emerald-500/30 rounded-sm transition-all text-[12px] font-bold"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Galleries Grid */}
          {results.galleries?.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-1">
              {results.galleries.map((g: any, i: number) => (
                <Link
                  key={`gal-${i}`}
                  href={`/gallery/${g.slug}`}
                  className="group relative aspect-[2/3] overflow-hidden bg-muted/20"
                >
                  <img 
                    src={g.cover_url} 
                    alt={g.title} 
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy" 
                  />
                  {/* Bottom title overlay */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-2 pt-8">
                    <p className="text-[11px] font-bold text-white leading-tight line-clamp-2 drop-shadow-lg">
                      {g.title}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* No Results */}
          {!results.model && results.galleries?.length === 0 && (
            <div className="py-20 text-center">
              <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground font-bold text-lg">No results found</p>
              <p className="text-muted-foreground/60 text-sm mt-2">Try a different keyword, category, or model name.</p>
            </div>
          )}
        </div>
      )}

      {!isLoading && !results && !query && (
        <div className="py-20 text-center">
          <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground font-bold text-lg">Enter a search query</p>
          <p className="text-muted-foreground/60 text-sm mt-2">Search for categories, models, channels, or keywords.</p>
        </div>
      )}
    </div>
  )
}
