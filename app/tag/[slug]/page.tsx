/* eslint-disable @typescript-eslint/no-explicit-any */
import { notFound } from "next/navigation"
import { sql } from "@/lib/db"
import { adultDataLink } from "@/lib/adultdatalink"
import { checkQuota, incrementQuota } from "@/lib/quota"
import { tagGalleriesCache } from "@/lib/redis"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { InfiniteGallery } from "@/components/gallery/InfiniteGallery"

interface TagPageProps {
  params: Promise<{
    slug: string
  }>
}

export default async function TagPage({ params }: TagPageProps) {
  const resolvedParams = await params;
  
  // 1. Fetch Tag By Slug (Direct SQL to bypass REST timeouts)
  let tag;
  console.log(`[Tag Page] Fetching tag via SQL: ${resolvedParams.slug}`);
  
  try {
    const tags = await sql`
      SELECT * FROM tags WHERE slug = ${resolvedParams.slug}
    `;

    if (tags && tags.length > 0) {
      tag = tags[0];
      console.log(`[Tag Page] DB Hit (SQL): ${tag.name} (ID: ${tag.id})`);
    } else {
      console.log(`[Tag Page] Tag not found. Triggering JIT Discovery (SQL) for: ${resolvedParams.slug}`);
      const derivedName = resolvedParams.slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      
      const newTags = await sql`
        INSERT INTO tags (name, slug, type)
        VALUES (${derivedName}, ${resolvedParams.slug}, 'tag')
        ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
        RETURNING *
      `;

      if (!newTags || newTags.length === 0) {
        console.error(`[Tag Page] JIT Success but no data returned in SQL INSERT`);
        notFound();
      }
      
      tag = newTags[0];
      console.log(`[Tag Page] JIT Success (SQL): ${tag.name} (ID: ${tag.id})`);
    }
  } catch (error: any) {
    console.error(`[Tag Page] Critical SQL Error:`, error.message);
    notFound();
  }

  // 2. Fetch galleries for this tag (Redis First)
  let galleries: any[] = [];
  try {
    const cached = await tagGalleriesCache.get(tag.slug);
    if (cached && cached.length > 0) {
      galleries = cached;
    }
  } catch (err) {
    console.error("Redis Cache Error (Tag Galleries):", err);
  }

  // 3. Fallback to API if empty
  if (galleries.length === 0) {
    const hasQuota = await checkQuota();
    if (hasQuota) {
      try {
        const result = await adultDataLink.pornpics.search(tag.name, 0, 60);
        await incrementQuota();
        
        if (result && result.posts && result.posts.length > 0) {
          // Normalize the search results to ensure they have slugs and correct image properties
          galleries = result.posts.map((g: any) => {
            const galleryUrl = g.gallery_url || g.url;
            let extractedSlug = g.slug;
            if (!extractedSlug && galleryUrl) {
               const parts = galleryUrl.split('/').filter(Boolean);
               extractedSlug = parts[parts.length - 1] || '';
            }
            return {
              ...g,
              slug: extractedSlug,
              url: galleryUrl,
              cover_url: g.image_url || g.cover_url
            };
          });

          // Cache the normalized results
          await tagGalleriesCache.set(tag.slug, galleries).catch(console.error);
          
          const toInsert = galleries.map((g: any) => [
            g.title,
            g.slug || (g.url || "").split('/').filter(Boolean).pop(),
            g.url,
            g.cover_url,
            new Date().toISOString()
          ]);
          
          const inserted = await sql`
            INSERT INTO galleries (title, slug, url, cover_url, last_scraped_at)
            VALUES ${sql(toInsert)}
            ON CONFLICT (slug) DO UPDATE SET 
              title = EXCLUDED.title,
              cover_url = EXCLUDED.cover_url,
              last_scraped_at = EXCLUDED.last_scraped_at
            RETURNING id
          `;
            
          if (inserted && inserted.length > 0) {
            const linkages = inserted.map((g: any) => [g.id, tag.id]);
            await sql`
              INSERT INTO gallery_tags (gallery_id, tag_id)
              VALUES ${sql(linkages)}
              ON CONFLICT (gallery_id, tag_id) DO NOTHING
            `;
          }
        }
      } catch (err) {
        console.error(`Error fetching galleries for tag ${tag.slug}:`, err);
      }
    }
  }

  return (
    <div className="flex-1 flex flex-col w-full max-w-[1600px] mx-auto px-2 md:px-4 py-6 bg-background">
      {/* Header section matching the home screenshot style */}
      <div className="flex items-center gap-4 mb-6 px-2">
        <Link 
          href="/"
          className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold text-foreground/90 capitalize">{tag.name}</h1>
        <div className="flex bg-muted/30 p-0.5 rounded-sm ml-auto">
           <button className="px-4 py-1 text-xs font-bold bg-background text-foreground shadow-sm rounded-sm">Hot</button>
           <button className="px-4 py-1 text-xs font-bold text-muted-foreground hover:text-foreground">New</button>
        </div>
      </div>

      {/* Dense Gallery Grid with Infinite Scroll */}
      <InfiniteGallery 
        initialGalleries={galleries} 
        tag={tag.slug} 
        tagName={tag.name} 
      />

      {galleries.length === 0 && (
        <div className="col-span-full py-20 text-center text-muted-foreground font-medium">
          No galleries found for this category.
        </div>
      )}
    </div>
  );
}
