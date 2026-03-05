/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
import { notFound } from "next/navigation"
import { sql } from "@/lib/db"
import { ModelInfo } from "@/components/gallery/ModelInfo"
import { InfiniteGallery } from "@/components/gallery/InfiniteGallery"
import { ingestionService } from "@/lib/ingestion"
import Link from "next/link"
import { ArrowLeft, MessageSquare, Eye, ThumbsUp, ThumbsDown, Share2, Heart } from "lucide-react"
import GalleryView from "@/components/gallery/GalleryView"

interface GalleryPageProps {
  params: Promise<{
    slug: string
  }>
}

export default async function GalleryPage({ params }: GalleryPageProps) {
  const { slug } = await params;

  // 1. Fetch Gallery by Slug with Metadata (Direct SQL)
  let gallery: any;
  try {
    const galleries = await sql`
      SELECT * FROM galleries WHERE slug = ${slug}
    `;
    if (galleries && galleries.length > 0) {
      gallery = galleries[0];
    }
  } catch (err: any) {
    console.error(`[Gallery Page] SQL Error:`, err.message);
  }

  if (!gallery) {
    // JIT Gallery Discovery: If not in DB, create a placeholder and hydrate
    console.log(`[Gallery Page] Gallery not found in DB. Triggering JIT for: ${slug}`);
    const derivedTitle = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    try {
      const newGals = await sql`
        INSERT INTO galleries (title, slug, url, last_scraped_at)
        VALUES (
          ${derivedTitle}, 
          ${slug}, 
          ${`https://www.pornpics.com/galleries/${slug}/`}, 
          ${new Date().toISOString()}
        )
        ON CONFLICT (slug) DO UPDATE SET last_scraped_at = EXCLUDED.last_scraped_at
        RETURNING *
      `;
      
      if (newGals && newGals.length > 0) {
        gallery = newGals[0];
        console.log(`[Gallery Page] JIT Discovery Success for ${slug}`);
      } else {
        notFound();
      }
    } catch (err: any) {
      console.error(`[Gallery Page] JIT SQL Error:`, err.message);
      notFound();
    }
  }

  // 2. Fetch Images for this Gallery
  let images: any[] = [];
  try {
    images = await sql`
      SELECT * FROM images WHERE gallery_id = ${gallery.id} ORDER BY created_at ASC
    `;
  } catch (err: any) {
    console.error(`[Gallery Page] Image Fetch SQL Error:`, err.message);
  }

  let tags: any[] = [];
  try {
    tags = await sql`
      SELECT t.* FROM tags t
      JOIN gallery_tags gt ON gt.tag_id = t.id
      WHERE gt.gallery_id = ${gallery.id}
    `;
  } catch (err: any) {
    console.error(`[Gallery Page] Tag Fetch SQL Error:`, err.message);
  }
  
  // JIT Ingestion: If no images, fetch from API (Now also fetches metadata/tags)
  if (!images || images.length === 0) {
    const data = await ingestionService.hydrateGalleryImages(gallery.id, gallery.slug);
    if (data && data.images && data.images.length > 0) {
      const toInsert = data.images.map((img: any) => ({
        gallery_id: gallery.id,
        url: img.url,
      }));

      try {
        await sql`
          INSERT INTO images (gallery_id, url)
          VALUES ${sql(toInsert.map((img: any) => [img.gallery_id, img.url]))}
          ON CONFLICT (gallery_id, url) DO NOTHING
        `;

        if (data.tags && data.tags.length > 0) {
          const insertedTags = await sql`
            INSERT INTO tags (name, slug, type)
            VALUES ${sql(data.tags.map((t: any) => [t.name, t.slug, t.type]))}
            ON CONFLICT (slug) DO UPDATE SET type = EXCLUDED.type
            RETURNING *
          `;

          if (insertedTags && insertedTags.length > 0) {
            const linkages = insertedTags.map((t: any) => [gallery.id, t.id]);
            await sql`
              INSERT INTO gallery_tags (gallery_id, tag_id)
              VALUES ${sql(linkages)}
              ON CONFLICT (gallery_id, tag_id) DO NOTHING
            `;
            tags = insertedTags;
          }
        }
        
        if (data.metadata) {
          await sql`
            UPDATE galleries SET 
              views = ${data.metadata.views || 0},
              rating = ${data.metadata.rating || 0},
              last_scraped_at = ${new Date().toISOString()}
            WHERE id = ${gallery.id}
          `;
          Object.assign(gallery, data.metadata);
        }
        
        images = toInsert.map((img: any, i: number) => ({ ...img, id: `temp-${i}` }));
      } catch (err: any) {
        console.error(`[Gallery Page] Hydration SQL Error:`, err.message);
      }
    }
  }
  
  // Find related galleries (sharing at least one tag)
  let relatedGalleries: any[] = [];
  if (tags.length > 0) {
    const tagIds = tags.map(t => t.id);
    try {
      const relatedResult = await sql`
        SELECT g.* FROM galleries g
        JOIN gallery_tags gt ON gt.gallery_id = g.id
        WHERE gt.tag_id IN ${sql(tagIds)}
        AND g.id != ${gallery.id}
        LIMIT 10
      `;
      
      // De-duplicate related galleries
      const seen = new Set();
      relatedGalleries = relatedResult.filter((g: any) => {
          if (!g || seen.has(g.id)) return false;
          seen.add(g.id);
          return true;
      }).slice(0, 10);
    } catch (err: any) {
      console.error(`[Gallery Page] Related Galleries SQL Error:`, err.message);
    }
  }

  // Find models from DB whose names appear in the title
  let dbModels: any[] = [];
  if (gallery.title) {
    try {
      dbModels = await sql`
        SELECT name, slug, type FROM tags 
        WHERE type = 'model' 
        AND position(lower(name) in lower(${gallery.title})) > 0
        LIMIT 5
      `;
    } catch { /* ignore */ }
  }

  // Categorize all tags
  const models: { name: string; slug: string }[] = [];
  const channels: { name: string; slug: string }[] = [];
  const categories: { name: string; slug: string }[] = [];
  const tagsList: { name: string; slug: string }[] = [];

  // DB model matches first
  dbModels.forEach((t: any) => {
    models.push({ name: t.name, slug: t.slug });
  });

  // Then tags from gallery
  tags.forEach((t: any) => {
    const item = { name: t.name, slug: t.slug };
    if (t.type === 'model') {
      if (!models.some(m => m.slug === t.slug)) models.push(item);
    }
    else if (t.type === 'channel') channels.push(item);
    else if (t.is_category || t.name.split(' ').length <= 2) categories.push(item);
    else tagsList.push(item);
  });

  // Fallback: regex title parsing only if DB found nothing
  if (models.length === 0) {
    const patterns = [
      /(?:featuring|feat\.?|ft\.?)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]*){0,2})/,
      /(?:starring)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]*){0,2})/,
      /(?:performed\s+by)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]*){0,2})/,
    ];
    for (const pattern of patterns) {
      const match = gallery.title.match(pattern);
      if (match) {
        const noiseWords = new Set(['hot', 'xxx', 'porn', 'pics', 'naked', 'nude', 'sex', 'sexy', 'images', 'photos', 'gallery']);
        const rawName = match[1].trim();
        const words = rawName.split(/\s+/).filter((w: string) => !noiseWords.has(w.toLowerCase()));
        if (words.length >= 1) {
          const name = words.slice(0, 3).join(' ');
          models.push({ name, slug: name.toLowerCase().replace(/\s+/g, '-') });
          break;
        }
      }
    }
  }

  const clean = (val: string | null) => {
      if (!val) return null;
      return val.replace(/\s+(?:Naked\s+)?Porn\s+Pics$/i, '').trim();
  };

  const cleanedModels = models.map(m => ({ ...m, name: clean(m.name)! }));
  const cleanedChannels = channels.map(c => ({ ...c, name: clean(c.name)! }));
  const cleanedCategories = categories.map(c => ({ ...c, name: clean(c.name)! }));
  const cleanedTagsList = tagsList.map(t => ({ ...t, name: clean(t.name)! }));


  return (
    <div className="flex flex-col w-full max-w-[1600px] mx-auto px-2 md:px-6 py-4 md:py-6 bg-background">
      {/* Back Link */}
      <Link 
        href="/"
        className="inline-flex items-center text-xs font-bold text-muted-foreground hover:text-foreground transition-colors mb-4 uppercase tracking-wider"
      >
        <ArrowLeft className="w-3 h-3 mr-1.5" />
        Back to Gallary
      </Link>

      {/* Main Container */}
      <div className="flex flex-col gap-6">
        
        {/* Gallery Media (Slideshow & Grid) */}
        <GalleryView images={images} galleryTitle={gallery.title} />

        {/* Title & Interaction Section (Moved to Bottom) */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mt-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground/90 leading-tight">
              {gallery.title}
            </h1>
            {/* Structured Metadata Section */}
            <div className="flex flex-col gap-3 mt-4 text-sm font-bold uppercase tracking-tighter">
               {/* Channels */}
               {cleanedChannels.length > 0 && (
                 <div className="flex flex-col md:flex-row md:items-start gap-2">
                   <span className="text-muted-foreground w-24 flex-shrink-0 mt-1">Channel:</span>
                   <div className="flex flex-wrap gap-1.5">
                     {cleanedChannels.map(c => (
                       <Link key={c.slug} href={`/tag/${c.slug}`} className="px-3 py-1 bg-muted/40 hover:bg-muted/60 text-foreground/90 rounded border border-muted/20 transition-all font-black text-[11px]">
                         {c.name}
                       </Link>
                     ))}
                   </div>
                 </div>
               )}

               {/* Models */}
               <div className="flex flex-col md:flex-row md:items-start gap-2">
                 <span className="text-muted-foreground w-24 flex-shrink-0 mt-1">Models:</span>
                 <div className="flex flex-wrap gap-1.5">
                   {cleanedModels.map(m => (
                     <Link key={m.slug} href={`/pornstar/${m.slug}`} className="px-3 py-1 bg-pink-500/10 hover:bg-pink-500/20 text-pink-500 rounded border border-pink-500/20 transition-all font-black text-[11px]">
                       {m.name}
                     </Link>
                   ))}
                   <button className="px-2 py-0.5 bg-muted/20 text-muted-foreground hover:text-foreground rounded border border-dashed border-muted/30 transition-all text-[9px] lowercase font-medium">
                     + Suggest
                   </button>
                 </div>
               </div>

               {/* Categories */}
               {cleanedCategories.length > 0 && (
                 <div className="flex flex-col md:flex-row md:items-start gap-2">
                   <span className="text-muted-foreground w-24 flex-shrink-0 mt-1">Categories:</span>
                   <div className="flex flex-wrap gap-1.5">
                     {cleanedCategories.map(c => (
                       <Link key={c.slug} href={`/tag/${c.slug}`} className="px-3 py-1 bg-muted/30 hover:bg-muted/50 text-foreground/80 rounded border border-muted/20 transition-all font-black text-[11px]">
                         {c.name}
                       </Link>
                     ))}
                     <button className="px-2 py-0.5 bg-muted/20 text-muted-foreground hover:text-foreground rounded border border-dashed border-muted/30 transition-all text-[9px] lowercase font-medium">
                       + Suggest
                     </button>
                   </div>
                 </div>
               )}

               {/* Tags List */}
               {cleanedTagsList.length > 0 && (
                  <div className="flex flex-col md:flex-row md:items-start gap-2">
                    <span className="text-muted-foreground w-24 flex-shrink-0 mt-1">Tags List:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {cleanedTagsList.map(t => (
                        <Link key={t.slug} href={`/tag/${t.slug}`} className="px-2.5 py-1 bg-muted/10 hover:bg-muted/30 text-muted-foreground hover:text-foreground rounded border border-muted/10 transition-all text-[11px] font-medium">
                          {t.name}
                        </Link>
                      ))}
                    </div>
                  </div>
               )}

               {/* Stats Row */}
               <div className="flex items-center gap-4 py-3 text-[10px] text-muted-foreground/60 tracking-widest border-t border-muted/10 mt-2 font-medium">
                  <span className="flex items-center gap-1.5">
                    Rating: <span className="text-foreground/80 font-black">{gallery.rating || '91%'}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    Views: <span className="text-foreground/80 font-black">{gallery.views?.toLocaleString() || '0'}</span>
                  </span>
               </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-muted/30 hover:bg-muted/50 rounded-lg text-sm font-bold transition-all border border-muted/20">
              <ThumbsUp className="w-4 h-4" />
              <span>Like</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-muted/30 hover:bg-muted/50 rounded-lg text-sm font-bold transition-all border border-muted/20">
              <ThumbsDown className="w-4 h-4" />
              <span>Dislike</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-muted/30 hover:bg-muted/50 rounded-lg text-sm font-bold transition-all border border-muted/20">
              <Heart className="w-4 h-4 mr-0.5" />
              <span>Favorite</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-muted/30 hover:bg-muted/50 rounded-lg text-sm font-bold transition-all border border-muted/20">
              <Share2 className="w-4 h-4" />
              <span>Share</span>
            </button>
          </div>
        </div>

        {/* Comment Section Placeholder */}
        <div className="mt-8">
           <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-5 h-5 text-pink-500" />
              <h3 className="font-bold text-lg">Comments</h3>
              <span className="px-2 py-0.5 bg-muted/50 rounded text-xs text-muted-foreground">0</span>
           </div>
           <div className="bg-muted/20 border border-muted/30 rounded-xl p-6 flex flex-col items-center justify-center text-center py-12">
              <p className="text-muted-foreground mb-4">You must be logged in to post a comment.</p>
              <button className="px-6 py-2 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-lg transition-all">
                Login / Register
              </button>
           </div>
        </div>

        {/* Related Field */}
        <div className="mt-12">
            <div className="flex items-center gap-2 mb-6 border-b border-muted/20 pb-4">
                <div className="w-1.5 h-6 bg-pink-600 rounded-full" />
                <h2 className="text-xl font-bold uppercase tracking-tight">Related Galleries</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-2">
                {relatedGalleries.map((rel, i) => (
                    <Link 
                        key={`${rel.slug}-${i}`} 
                        href={`/gallery/${rel.slug}`}
                        className="group relative aspect-[2/3] overflow-hidden bg-muted/20 rounded-sm"
                    >
                        <img 
                            src={rel.cover_url}
                            alt={rel.title}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent">
                            <div className="absolute bottom-2 left-2 right-2">
                                <p className="text-[11px] font-bold text-white leading-tight line-clamp-2 drop-shadow-lg">
                                    {rel.title}
                                </p>
                            </div>
                        </div>
                        <div className="absolute top-2 left-2">
                            <span className="px-1.5 py-0.5 bg-pink-600 text-[9px] font-black text-white rounded uppercase tracking-tighter">Related</span>
                        </div>
                    </Link>
                ))}
            </div>
        </div>

      </div>
    </div>
  );
}
