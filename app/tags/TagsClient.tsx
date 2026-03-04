"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")

interface Tag {
  name: string
  slug: string
}

export default function TagsClient({ initialTags }: { initialTags: Tag[] }) {
  const [activeTab, setActiveTab] = useState<"Popular" | "List">("List")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedLetter, setSelectedLetter] = useState<string>("A")

  // Filter tags based on selected letter and search query
  const filteredTags = useMemo(() => {
    let filtered = initialTags

    if (searchQuery.length >= 3) {
      filtered = filtered.filter(tag => 
        tag.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    } else if (activeTab === "List") {
      filtered = filtered.filter(tag => tag.name.toUpperCase().startsWith(selectedLetter))
    } else if (activeTab === "Popular") {
      // Just returning a random subset for "popular" until we have views ranking
      filtered = initialTags.filter((_, i) => i % 15 === 0).slice(0, 40)
    }

    return filtered;
  }, [initialTags, searchQuery, activeTab, selectedLetter])

  return (
    <div className="flex-1 p-6 lg:p-12">
      <div className="flex flex-col gap-6 max-w-7xl mx-auto">
        
        {/* Header & Tabs */}
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Categories & Tags List</h1>
          <div className="flex bg-muted/50 p-1 rounded-md w-fit">
            <Button 
              variant={activeTab === "Popular" ? "secondary" : "ghost"} 
              size="sm" 
              className="text-sm font-medium"
              onClick={() => { setActiveTab("Popular"); setSearchQuery(""); }}
            >
              Popular
            </Button>
            <Button 
              variant={activeTab === "List" ? "secondary" : "ghost"} 
              size="sm"
              className="text-sm font-medium"
              onClick={() => { setActiveTab("List"); setSearchQuery(""); }}
            >
              List
            </Button>
          </div>
        </div>

        {/* Search Input */}
        <div className="max-w-xl">
          <Input 
            type="search" 
            placeholder="Search tags (3 characters minimum)" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-background"
          />
        </div>

        {/* Alphabet Filter (Only show if List tab is active and not searching) */}
        {activeTab === "List" && searchQuery.length < 3 && (
          <div className="flex flex-wrap gap-1">
            {ALPHABET.map((letter) => (
              <Button
                key={letter}
                variant={selectedLetter === letter ? "default" : "outline"}
                size="sm"
                className={`w-10 h-10 p-0 font-medium transition-all ${
                  selectedLetter === letter 
                    ? "bg-pink-600 text-white hover:bg-pink-700 border-transparent shadow-md scale-105" 
                    : "bg-background hover:bg-muted text-muted-foreground"
                }`}
                onClick={() => setSelectedLetter(letter)}
              >
                {letter}
              </Button>
            ))}
          </div>
        )}

        {/* Tags Display */}
        <div className="mt-8 border-t pt-8">
          {searchQuery.length < 3 && activeTab === "List" && (
            <div className="flex gap-4 mb-6">
              <h2 className="text-4xl font-bold text-pink-600 w-8">{selectedLetter}</h2>
            </div>
          )}
          
          {filteredTags.length > 0 ? (
            <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-4 ${
              searchQuery.length < 3 && activeTab === "List" ? "md:ml-12" : ""
            }`}>
              {filteredTags.map(tag => (
                <Link 
                  key={tag.slug} 
                  href={`/tag/${tag.slug}`}
                  className="text-sm text-foreground/80 hover:text-pink-600 hover:underline hover:-translate-y-0.5 transition-all duration-200 block"
                >
                  {tag.name}
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-muted-foreground text-center py-12 border border-dashed rounded-lg">
              No tags found matching your criteria.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
