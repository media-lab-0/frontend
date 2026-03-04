/* eslint-disable @typescript-eslint/no-explicit-any */

"use client"

import { useState, useEffect, useRef, useCallback } from 'react'
import { PornstarCard } from '@/components/gallery/PornstarCard'
import { Loader2, ChevronDown, RotateCcw } from 'lucide-react'

const FILTERS = [
  { id: 'gender', label: 'Gender', options: ['female', 'male'] },
  { id: 'age', label: 'Age', options: ['teen', 'mature', 'milf', 'granny'] },
  { id: 'ethnicity', label: 'Ethnicity', options: ['white', 'black', 'latina', 'asian', 'indian'] },
  { id: 'tits', label: 'Tits', options: ['big-tits', 'tiny-tits', 'fake-tits', 'natural-tits'] },
  { id: 'nationality', label: 'Nationality', options: ['us', 'gb', 'jp', 'de', 'br', 'ru', 'in', 'it', 'fr', 'es'] },
  { id: 'hair', label: 'Hair', options: ['blonde', 'brunette', 'redhead'] },
  { id: 'body', label: 'Body', options: ['bbw', 'petite', 'skinny', 'tall', 'short'] },
];

export default function PornstarsPage() {
  const [pornstars, setPornstars] = useState<any[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [filters, setFilters] = useState<any>({ sort: 'popular' })
  const [mode, setMode] = useState<'popular' | 'list'>('popular')
  const [openFilter, setOpenFilter] = useState<string | null>(null)
  
  const loaderRef = useRef<HTMLDivElement>(null)

  const fetchPornstars = useCallback(async (pageNum: number, currentFilters: any, isNew: boolean = false) => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const searchParams = new URLSearchParams();
      searchParams.append('page', pageNum.toString());
      Object.entries(currentFilters).forEach(([key, value]) => {
        if (value) searchParams.append(key, value as string);
      });

      const res = await fetch(`/api/pornstars?${searchParams.toString()}`);
      const data = await res.json();

      if (data.pornstars && data.pornstars.length > 0) {
        setPornstars(prev => isNew ? data.pornstars : [...prev, ...data.pornstars]);
        if (data.pornstars.length < 40) setHasMore(false);
      } else {
        if (isNew) setPornstars([]);
        setHasMore(false);
      }
    } catch (err) {
      console.error('Error fetching pornstars:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  // Handle filter changes
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    fetchPornstars(1, filters, true);
  }, [filters, fetchPornstars]);

  // Infinite Scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading && pornstars.length > 0) {
          const nextIteration = page + 1;
          setPage(nextIteration);
          fetchPornstars(nextIteration, filters);
        }
      },
      { threshold: 0.1 }
    );

    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasMore, isLoading, page, filters, pornstars.length, fetchPornstars]);

  const toggleFilter = (id: string, value: string) => {
    setFilters((prev: any) => {
      const current = prev[id];
      if (current === value) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: value };
    });
    setOpenFilter(null);
  };

  const resetFilters = () => {
    setFilters({ sort: 'popular' });
    setMode('popular');
  };

  return (
    <div className="flex-1 flex flex-col w-full max-w-[1600px] mx-auto px-2 md:px-4 py-6 bg-background">
      
      {/* Title & Mode Toggle */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6 px-2">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-foreground/90 uppercase tracking-tight">Popular Pornstars</h1>
          <span className="text-[10px] text-muted-foreground align-top mt-1 font-black">20,181</span>
        </div>
        
        <div className="flex bg-muted/30 p-0.5 rounded-sm w-fit">
           <button 
             onClick={() => setMode('popular')}
             className={`px-6 py-1 text-[11px] font-black uppercase transition-all rounded-sm ${mode === 'popular' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
           >
             Popular
           </button>
           <button 
             onClick={() => setMode('list')}
             className={`px-6 py-1 text-[11px] font-black uppercase transition-all rounded-sm ${mode === 'list' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
           >
             List
           </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-1.5 mb-8 px-2 relative z-20">
        {FILTERS.map((f) => (
          <div key={f.id} className="relative">
            <button 
              onClick={() => setOpenFilter(openFilter === f.id ? null : f.id)}
              className={`flex items-center gap-2 px-3 py-1.5 bg-muted/30 hover:bg-muted/50 border border-muted/20 rounded text-[12px] font-bold transition-all ${filters[f.id] ? 'border-pink-500/50 text-pink-500' : 'text-muted-foreground'}`}
            >
              {filters[f.id] || f.label}
              <ChevronDown className={`w-3 h-3 transition-transform ${openFilter === f.id ? 'rotate-180' : ''}`} />
            </button>
            
            {openFilter === f.id && (
              <div className="absolute top-full left-0 mt-1 w-40 bg-zinc-900 border border-muted/20 rounded shadow-2xl py-1 z-50 animate-in fade-in slide-in-from-top-1 duration-200">
                {f.options.map(opt => (
                  <button
                    key={opt}
                    onClick={() => toggleFilter(f.id, opt)}
                    className={`w-full text-left px-3 py-1.5 text-xs font-bold hover:bg-pink-600/20 hover:text-pink-500 transition-colors uppercase ${filters[f.id] === opt ? 'bg-pink-600/10 text-pink-500' : 'text-muted-foreground'}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        
        <button 
          onClick={resetFilters}
          className="flex items-center gap-2 px-3 py-1.5 bg-muted/20 hover:bg-muted/40 text-muted-foreground rounded text-[12px] font-bold transition-all"
        >
          <RotateCcw className="w-3 h-3" />
          Reset
        </button>

        <div className="ml-auto hidden lg:flex items-center gap-2 text-[11px] font-black text-muted-foreground uppercase">
          Sorted by: 
          <span className="text-foreground">Most Popular</span>
          <ChevronDown className="w-3 h-3" />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-5 gap-1 md:gap-1.5">
        {pornstars.map((star, i) => (
          <PornstarCard 
            key={`${star.name}-${i}`}
            name={star.name}
            image={star.image}
            galleries={star.galleries}
          />
        ))}
      </div>

      {/* Loader */}
      {hasMore && (
        <div 
          ref={loaderRef}
          className="mt-12 py-10 flex flex-col items-center gap-4 border-t border-muted/20"
        >
          <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
        </div>
      )}

      {!hasMore && pornstars.length > 0 && (
        <div className="mt-12 py-10 flex flex-col items-center gap-2 border-t border-muted/20">
          <p className="text-muted-foreground text-[11px] font-black uppercase tracking-widest">End of results</p>
        </div>
      )}
    </div>
  );
}
