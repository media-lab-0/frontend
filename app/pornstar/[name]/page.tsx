/* eslint-disable @typescript-eslint/no-explicit-any */

import { notFound } from "next/navigation"
import { adultDataLink } from "@/lib/adultdatalink"
import { ModelInfo } from "@/components/gallery/ModelInfo"
import Link from "next/link"
import { ArrowLeft, Heart, Share2, Folder, Star, MessageSquare } from "lucide-react"
import { InfiniteGallery } from "@/components/gallery/InfiniteGallery"

interface PornstarPageProps {
  params: Promise<{
    name: string
  }>
}

export default async function PornstarDetailPage({ params }: PornstarPageProps) {
  const { name } = await params;
  const decodedName = decodeURIComponent(name).replace(/-/g, ' ');

  // Fetch Model Profile Data
  let modelData = null;
  try {
    modelData = await adultDataLink.pornstar.getPornstarData(decodedName);
  } catch (err) {
    console.error("Failed to fetch model data:", err);
  }

  if (!modelData) {
    // Fallback/Search if no specific profile found? For now just try to proceed with limited data
  }

  // Fetch initial galleries for this model via search
  let initialGalleries = [];
  try {
    const searchResult = await adultDataLink.pornpics.search(decodedName, 0, 20);
    if (searchResult && searchResult.posts) {
      initialGalleries = searchResult.posts.map((g: any) => ({
        ...g,
        slug: g.slug || (g.gallery_url || g.url || "").split('/').filter(Boolean).pop(),
        cover_url: g.image_url || g.cover_url
      }));
    }
  } catch (err) {
    console.error("Failed to fetch model galleries:", err);
  }

  return (
    <div className="flex flex-col w-full max-w-[1600px] mx-auto px-2 md:px-6 py-4 md:py-6 bg-background">
      {/* Back Link */}
      <Link 
        href="/pornstars"
        className="inline-flex items-center text-xs font-bold text-muted-foreground hover:text-foreground transition-colors mb-4 uppercase tracking-wider"
      >
        <ArrowLeft className="w-3 h-3 mr-1.5" />
        Back to Pornstars
      </Link>

      {/* Profile Header */}
      <div className="flex flex-col md:flex-row gap-8 mb-8 border-b border-muted/20 pb-8">
        {/* Avatar */}
        <div className="relative w-40 h-40 md:w-48 md:h-48 rounded-full overflow-hidden border-4 border-muted/30 shadow-2xl flex-shrink-0 mx-auto md:mx-0 bg-muted/20">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={modelData?.avatar || modelData?.image_url || `https://ui-avatars.com/api/?name=${name}&background=random&size=256`} 
            alt={decodedName}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Info Box */}
        <div className="flex-1 flex flex-col justify-center text-center md:text-left">
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
            <h1 className="text-3xl md:text-4xl font-black text-foreground/90 uppercase truncate">
              {modelData?.name || decodedName}
            </h1>
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
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500 fill-current" />
              <span>Age: {modelData?.age || "N/A"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Folder className="w-4 h-4 text-pink-500" />
              <span>{modelData?.total_video_count || "0"} Galleries</span>
            </div>
          </div>
        </div>
      </div>

      {/* Model Info Section */}
      <ModelInfo data={modelData} />

      {/* Galleries Section */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-6 border-b border-muted/20 pb-4">
           <div className="flex items-center gap-2">
              <div className="w-1.5 h-6 bg-pink-600 rounded-full" />
              <h2 className="text-xl font-black uppercase tracking-tight">Recent Galleries</h2>
           </div>
           <div className="hidden sm:flex items-center gap-4 text-xs font-black text-muted-foreground uppercase">
              <span>Sort by:</span>
              <span className="text-foreground border-b border-pink-500 cursor-pointer">Most Popular</span>
              <span className="hover:text-foreground cursor-pointer transition-colors">Most Recent</span>
           </div>
        </div>

        {/* We use InfiniteGallery but it needs to be parameterized for a search query */}
        <InfiniteGallery initialGalleries={initialGalleries} tag={name} tagName={decodedName} />
      </div>

      {/* Comments Section Placeholder */}
      <div className="mt-12 pt-12 border-t border-muted/20">
         <div className="flex items-center gap-2 mb-6">
            <MessageSquare className="w-5 h-5 text-pink-500" />
            <h3 className="font-extrabold text-xl uppercase tracking-tight">User Comments</h3>
            <span className="px-2 py-0.5 bg-muted/50 rounded-sm text-xs font-black text-muted-foreground">0</span>
         </div>
         <div className="bg-muted/10 border border-muted/20 rounded-lg p-10 flex flex-col items-center justify-center text-center">
            <p className="text-muted-foreground text-sm font-medium mb-5">Share your thoughts about {decodedName}!</p>
            <button className="px-8 py-2.5 bg-pink-600 hover:bg-pink-700 text-white text-xs font-black uppercase tracking-widest rounded transition-all shadow-lg hover:shadow-pink-600/20">
              Sign In to Comment
            </button>
         </div>
      </div>
    </div>
  )
}
