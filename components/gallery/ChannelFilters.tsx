"use client"

import { ChevronDown, RotateCcw } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

interface FilterOption {
  id: string
  label: string
  options: { name: string; slug: string }[]
}

interface ChannelFiltersProps {
  onFilterChange: (filters: any) => void
  onReset: () => void
  activeFilters: any
  networks: { name: string; slug: string }[]
  categories: { name: string; slug: string }[]
}

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map(l => ({ name: l, slug: l }));

export function ChannelFilters({ 
  onFilterChange, 
  onReset, 
  activeFilters,
  networks,
  categories
}: ChannelFiltersProps) {
  const [openFilter, setOpenFilter] = useState<string | null>(null)
  const filterRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setOpenFilter(null)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const filters: FilterOption[] = [
    { id: 'alphabet', label: 'Alphabet', options: ALPHABET },
    { id: 'category', label: 'Category', options: categories },
    { id: 'network', label: 'Network', options: networks },
  ]

  const handleToggle = (id: string, slug: string, name: string) => {
    const current = activeFilters[id]
    if (current?.slug === slug) {
      const next = { ...activeFilters }
      delete next[id]
      onFilterChange(next)
    } else {
      onFilterChange({ ...activeFilters, [id]: { name, slug } })
    }
    setOpenFilter(null)
  }

  return (
    <div ref={filterRef} className="flex flex-wrap items-center gap-2 mb-2 relative z-50">
      {filters.map((f) => (
        <div key={f.id} className="relative">
          <button 
            onClick={() => setOpenFilter(openFilter === f.id ? null : f.id)}
            className={`flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] hover:bg-[#252525] border transition-all rounded text-[13px] font-bold ${activeFilters[f.id] ? 'border-pink-500/50 text-pink-500' : 'border-[#333] text-[#999]'}`}
          >
            <span className="capitalize">{activeFilters[f.id]?.name || f.label}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openFilter === f.id ? 'rotate-180' : ''}`} />
          </button>
          
          {openFilter === f.id && (
            <div className="absolute top-full left-0 mt-1.5 w-56 max-h-80 overflow-y-auto bg-[#1a1a1a] border border-[#333] rounded shadow-2xl py-1 z-[60] scrollbar-thin scrollbar-thumb-zinc-800">
              {f.options.length > 0 ? (
                f.options.map(opt => (
                  <button
                    key={opt.slug}
                    onClick={() => handleToggle(f.id, opt.slug, opt.name)}
                    className={`w-full text-left px-4 py-2 text-[12px] font-bold hover:bg-pink-600/10 hover:text-pink-500 transition-colors uppercase tracking-tight ${activeFilters[f.id]?.slug === opt.slug ? 'bg-pink-600/20 text-pink-500' : 'text-[#888]'}`}
                  >
                    {opt.name}
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-[11px] text-muted-foreground italic">No options available</div>
              )}
            </div>
          )}
        </div>
      ))}
      
      <button 
        onClick={onReset}
        className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] hover:bg-[#252525] text-[#999] border border-[#333] rounded text-[13px] font-bold transition-all ml-1"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        Reset
      </button>
    </div>
  )
}
