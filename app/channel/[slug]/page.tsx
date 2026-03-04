/* eslint-disable @typescript-eslint/no-explicit-any */
import { notFound } from "next/navigation"
import { sql } from "@/lib/db"
import { adultDataLink } from "@/lib/adultdatalink"
import { checkQuota, incrementQuota } from "@/lib/quota"
import { tagGalleriesCache } from "@/lib/redis"
import Link from "next/link"
import { ArrowLeft, Globe } from "lucide-react"
import { InfiniteGallery } from "@/components/gallery/InfiniteGallery"

interface ChannelPageProps {
  params: Promise<{
    slug: string
  }>
}

export default async function ChannelPage({ params }: ChannelPageProps) {
  const resolvedParams = await params;
  
  // 1. Fetch Channel By Slug
  let channel;
  try {
    const channels = await sql`
      SELECT * FROM tags WHERE slug = ${resolvedParams.slug} AND type = 'channel'
    `;

    if (channels && channels.length > 0) {
      channel = channels[0];
    } else {
      // JIT Discovery for channels if not in DB
      const derivedName = resolvedParams.slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      const newChannels = await sql`
        INSERT INTO tags (name, slug, type)
        VALUES (${derivedName}, ${resolvedParams.slug}, 'channel')
        ON CONFLICT (slug) DO UPDATE SET type = 'channel'
        RETURNING *
      `;
      channel = newChannels[0];
    }
  } catch (error: any) {
    console.error(`[Channel Page] DB Error:`, error.message);
    notFound();
  }

  // 2. Fetch galleries for this channel (Redis First)
  let galleries: any[] = [];
  try {
    const cached = await tagGalleriesCache.get(`chan:${channel.slug}`);
    if (cached && cached.length > 0) {
      galleries = cached;
    }
  } catch (err) {
    console.error("Redis Error:", err);
  }

  // 3. Fallback to API Search
  if (galleries.length === 0) {
    const hasQuota = await checkQuota();
    if (hasQuota) {
      try {
        const result = await adultDataLink.pornpics.search(channel.name, 0, 60);
        await incrementQuota();
        
        if (result && result.posts) {
          galleries = result.posts.map((g: any) => ({
            ...g,
            slug: g.slug || (g.gallery_url || g.url).split('/').filter(Boolean).pop(),
            cover_url: g.image_url || g.cover_url
          }));
          await tagGalleriesCache.set(`chan:${channel.slug}`, galleries).catch(console.error);
        }
      } catch (err) {
        console.error(`Error fetching galleries for channel ${channel.slug}:`, err);
      }
    }
  }

  return (
    <div className="flex-1 flex flex-col w-full max-w-[1600px] mx-auto px-2 md:px-4 py-6 bg-background">
      {/* Header */}
      <div className="flex flex-col gap-6 mb-8 px-2">
        <div className="flex items-center gap-4">
          <Link 
            href="/channels"
            className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-muted/30 text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex flex-col">
            <div className="flex items-center gap-2 text-pink-500 mb-1">
                <Globe className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Official Channel</span>
            </div>
            <h1 className="text-3xl font-black text-foreground uppercase tracking-tight leading-none">{channel.name}</h1>
          </div>
        </div>
      </div>

      {/* Grid */}
      <InfiniteGallery 
        initialGalleries={galleries} 
        tagName={channel.name} 
      />

      {galleries.length === 0 && (
        <div className="py-20 text-center text-muted-foreground font-medium">
          No galleries found for this channel.
        </div>
      )}
    </div>
  );
}
