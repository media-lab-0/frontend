/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
import { notFound } from "next/navigation"
import { sql } from "@/lib/db"
import { adultDataLink } from "@/lib/adultdatalink"
import { checkQuota, incrementQuota } from "@/lib/quota"
import { tagGalleriesCache } from "@/lib/redis"
import Link from "next/link"
import { ArrowLeft, Folder, Heart } from "lucide-react"
import { InfiniteGallery } from "@/components/gallery/InfiniteGallery"
import { ChannelTags } from "@/components/gallery/ChannelTags"

interface ChannelPageProps {
  params: Promise<{
    slug: string
  }>
}

export default async function ChannelPage({ params }: ChannelPageProps) {
  const resolvedParams = await params;
  
  // 1. Fetch Channel By Slug
  let channel: any;
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
  let totalCount = 0;
  let relatedTags: { name: string; slug: string }[] = [];

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
        
        if (result) {
          totalCount = result.total_count || 0;
          
          if (result.posts) {
            galleries = result.posts.map((g: any) => ({
              ...g,
              slug: g.slug || (g.gallery_url || g.url).split('/').filter(Boolean).pop(),
              cover_url: g.image_url || g.cover_url
            }));
            await tagGalleriesCache.set(`chan:${channel.slug}`, galleries).catch(console.error);
          }

          // Extract related tags from search results metadata
          if (result.related_tags && Array.isArray(result.related_tags)) {
            relatedTags = result.related_tags.slice(0, 15).map((t: any) => ({
              name: typeof t === 'string' ? t : t.name || t.tag,
              slug: (typeof t === 'string' ? t : t.name || t.tag || '').toLowerCase().replace(/\s+/g, '-')
            }));
          }

          // If no related_tags from API, extract names from gallery titles
          if (relatedTags.length === 0 && result.posts) {
            const nameSet = new Set<string>();
            const channelLower = channel.name.toLowerCase();
            const noiseWords = new Set(['hot', 'sexy', 'busty', 'cute', 'naked', 'nude', 'big', 'young', 'old', 'small', 'tiny', 'huge', 'amateur', 'beautiful', 'gorgeous', 'stunning', 'petite', 'curvy', 'slim', 'thick', 'naughty', 'wild', 'kinky', 'dirty', 'sweet', 'lovely', 'pretty', 'horny', 'solo', 'anal', 'oral', 'hardcore', 'softcore', 'lesbian', 'interracial']);
            
            for (const g of result.posts) {
              const title = g.title || '';
              // Match "Firstname Lastname" patterns (2+ capitalized words)
              const namePattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]*)+)\b/g;
              let match;
              while ((match = namePattern.exec(title)) !== null) {
                const candidate = match[1].trim();
                const words = candidate.split(/\s+/);
                // Skip if it's the channel name, or all noise words
                if (candidate.toLowerCase().includes(channelLower)) continue;
                if (words.every(w => noiseWords.has(w.toLowerCase()))) continue;
                if (words.length >= 2 && words.length <= 3) {
                  nameSet.add(candidate);
                }
              }
            }
            
            relatedTags = Array.from(nameSet).slice(0, 15).map(name => ({
              name,
              slug: name.toLowerCase().replace(/\s+/g, '-')
            }));
          }
        }
      } catch (err) {
        console.error(`Error fetching galleries for channel ${channel.slug}:`, err);
      }
    }
  }

  // Also try DB for known related tags/models
  if (relatedTags.length < 5) {
    try {
      const dbRelated = await sql`
        SELECT DISTINCT t2.name, t2.slug 
        FROM gallery_tags gt1
        JOIN gallery_tags gt2 ON gt1.gallery_id = gt2.gallery_id
        JOIN tags t2 ON gt2.tag_id = t2.id
        WHERE gt1.tag_id = ${channel.id}
          AND t2.id != ${channel.id}
          AND (t2.type = 'channel' OR t2.type = 'model')
        ORDER BY t2.name ASC
        LIMIT ${15 - relatedTags.length}
      `;
      const existing = new Set(relatedTags.map(t => t.slug));
      dbRelated.forEach((t: any) => {
        if (!existing.has(t.slug)) {
          relatedTags.push({ name: t.name, slug: t.slug });
        }
      });
    } catch { /* ignore */ }
  }

  // Use gallery_count from DB or API
  const galleryCount = channel.gallery_count || totalCount || galleries.length;
  const channelImage = channel.image_url || galleries[0]?.cover_url || null;

  return (
    <div className="flex-1 flex flex-col w-full max-w-[1600px] mx-auto px-2 md:px-4 py-6 bg-background">
      
      {/* Profile Header — Left-aligned */}
      <div className="flex flex-col gap-5 mb-8 px-2">
        {/* Back + title row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link 
              href="/channels"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <span className="text-sm font-bold text-foreground/80">{channel.name} Pics</span>
            <button className="text-muted-foreground hover:text-pink-500 transition-colors">
              <Heart className="w-4 h-4" />
            </button>
          </div>
          <div className="text-xs font-bold text-muted-foreground">Most Popular ▾</div>
        </div>

        {/* Logo + Name row */}
        <div className="flex items-center gap-5">
          {/* Circular Logo */}
          <div className="relative w-20 h-20 md:w-28 md:h-28 rounded-full overflow-hidden border-2 border-muted/30 bg-muted/20 shadow-xl flex-shrink-0">
            {channelImage ? (
              <img 
                src={channelImage} 
                alt={channel.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pink-900/30 to-black">
                <span className="text-2xl font-black text-white/30">{channel.name?.[0]}</span>
              </div>
            )}
          </div>

          {/* Name + Count */}
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl md:text-4xl font-black text-foreground uppercase tracking-tight">
              {channel.name}
            </h1>
            <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
              <Folder className="w-4 h-4 text-pink-500" />
              <span>{galleryCount > 0 ? galleryCount.toLocaleString() : '—'}</span>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground text-center md:text-left leading-relaxed max-w-3xl">
          Browse the best {channel.name} nude pics and galleries. Featuring exclusive content from {channel.name}. Updated daily with high quality images.
        </p>

        {/* Related Tags — right after the description */}
        <ChannelTags tags={relatedTags} />
      </div>

      {/* Gallery Grid */}
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
