/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useEffect, useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function CategoryGrid({ initialCategories }: { initialCategories: any[] }) {
  const [categories, setCategories] = useState<any[]>([])
  const [offset, setOffset] = useState(initialCategories.length)
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const loaderRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Initial shuffle for the first batch to keep user experience fresh
    const shuffled = [...initialCategories];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setCategories(shuffled)
  }, [initialCategories])

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/categories?offset=${offset}&limit=40`);
      const data = await response.json();

      if (data.categories && data.categories.length > 0) {
        setCategories(prev => [...prev, ...data.categories]);
        setOffset(prev => prev + data.categories.length);
        if (data.categories.length < 40) {
          setHasMore(false);
        }
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading more categories:', error);
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  }, [offset, hasMore, isLoading]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      async (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading && categories.length > 0) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoading, categories.length, loadMore]);

  if (categories.length === 0) {
    return null;
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 gap-1 md:gap-1 lg:gap-1">
        {categories.map((cat, i) => (
          <Link 
            key={`${cat.slug}-${i}`} 
            href={`/tag/${cat.slug}`}
            className="group relative aspect-[2/3] overflow-hidden bg-muted/20"
          >
            {/* Category Image */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={cat.image_url!}
              alt={cat.name}
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
            />
            
            {/* Overlay Label */}
            <div className="absolute">
              <div className="px-2 py-0.5 bg-black/40 backdrop-blur-md">
                <span className="text-white font-bold text-[13px] leading-tight drop-shadow-md">
                  {cat.name}
                </span>
              </div>
            </div>

            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        ))}
      </div>

      {hasMore && (
        <div 
          ref={loaderRef}
          className="mt-12 py-10 flex flex-col items-center gap-4 border-t border-muted/20"
        >
          <div className="flex items-center gap-2 text-muted-foreground animate-pulse">
            <Loader2 className="w-25 h-25 animate-spin text-pink-500" />
          </div>
        </div>
      )}

      {!hasMore && (
        <div className="mt-12 py-10 flex flex-col items-center gap-2 border-t border-muted/20">
          <p className="text-muted-foreground text-xs font-medium">All categories loaded</p>
        </div>
      )}
    </>
  )
}
