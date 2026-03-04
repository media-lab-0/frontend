"use client"

import { useEffect, useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'

interface Gallery {
  slug: string;
  title: string;
  cover_url: string;
}

interface InfiniteGalleryProps {
  initialGalleries: Gallery[];
  filter?: string;
  tag?: string;
  tagName?: string;
  time?: string;
}

export function InfiniteGallery({ 
  initialGalleries, 
  filter, 
  tag, 
  tagName,
  time 
}: InfiniteGalleryProps) {
  const [galleries, setGalleries] = useState<Gallery[]>(initialGalleries);
  const [offset, setOffset] = useState(initialGalleries.length);
  const [hasMore, setHasMore] = useState(
    initialGalleries.length >= 20 || 
    (initialGalleries.length === 0 && (!!tag || !!tagName || !!filter))
  );
  const [isLoading, setIsLoading] = useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Reset when tag/tagName/filter changes
    setGalleries(initialGalleries);
    setOffset(initialGalleries.length);
    setHasMore(
      initialGalleries.length >= 20 || 
      (initialGalleries.length === 0 && (!!tag || !!tagName || !!filter))
    );
  }, [initialGalleries, tag, tagName, filter]);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        offset: offset.toString(),
        limit: '20'
      });
      if (filter) params.append('filter', filter);
      if (tag) params.append('tag', tag);
      // Combined tagName (e.g. "Brazzers POV")
      if (tagName) params.append('tagName', tagName);
      if (time) params.append('time', time);

      const response = await fetch(`/api/galleries?${params.toString()}`);
      const data = await response.json();

      if (data.galleries && data.galleries.length > 0) {
        setGalleries(prev => [...prev, ...data.galleries]);
        setOffset(prev => prev + data.galleries.length);
        if (data.galleries.length < 20) {
          setHasMore(false);
        }
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading more galleries:', error);
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  }, [offset, hasMore, isLoading, filter, tag, tagName, time]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      async (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoading, loadMore]);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 gap-1 md:gap-1 lg:gap-1">
        {galleries.map((gallery, i) => (
          <Link 
            key={`${gallery.slug}-${i}`} 
            href={`/gallery/${gallery.slug}`}
            className="group relative aspect-[2/3] overflow-hidden bg-muted/20"
          >
            <img 
              src={gallery.cover_url}
              alt={gallery.title}
              className="absolute inset-x-0 inset-y-0 w-full h-full object-cover"
              loading="lazy"
            />
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

      {!hasMore && galleries.length > 0 && (
        <div className="mt-12 py-10 flex flex-col items-center gap-2 border-t border-muted/20">
          <p className="text-muted-foreground text-xs font-medium">You&apos;ve reached the end of the collection</p>
          <p className="text-muted-foreground/50 text-[10px] uppercase font-bold">Showing {galleries.length} items</p>
        </div>
      )}
    </>
  );
}
