/* eslint-disable @typescript-eslint/no-explicit-any */
import { notFound } from "next/navigation"
import { adultDataLink } from "@/lib/adultdatalink"
import { checkQuota, incrementQuota } from "@/lib/quota"
import { filteredGalleriesCache } from "@/lib/redis"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { InfiniteGallery } from "@/components/gallery/InfiniteGallery"

interface PicsPageProps {
  params: Promise<{
    filter: string
  }>
  searchParams: Promise<{
    [key: string]: string | string[] | undefined
  }>
}

const VALID_FILTERS = ['popular', 'recent', 'rating', 'likes', 'views', 'comments']
const VALID_TIMES = ['weekly', 'month', 'all-time']

export default async function FilteredPicsPage({ params, searchParams }: PicsPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  
  const filter = resolvedParams.filter.toLowerCase();
  
  if (!VALID_FILTERS.includes(filter)) {
    notFound();
  }

  // Handle time param, default to weekly
  let time = typeof resolvedSearchParams.time === 'string' ? resolvedSearchParams.time.toLowerCase() : 'weekly';
  if (!VALID_TIMES.includes(time)) {
    time = 'weekly';
  }

  // 1. Fetch galleries for this filter (Redis First)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let galleries: any[] = [];
  const cacheKey = `${filter}-${time}`;
  
  try {
    const cached = await filteredGalleriesCache.get(cacheKey);
    if (cached && cached.length > 0) {
      galleries = cached;
    }
  } catch (err) {
    console.error(`Redis Cache Error (Filter ${cacheKey}):`, err);
  }

  // 2. Fallback to API if empty
  if (galleries.length === 0) {
    const hasQuota = await checkQuota();
    if (hasQuota) {
      try {
        const result = await adultDataLink.pornpics.getGalleries({ filter_type: filter, time, limit: 60 });
        await incrementQuota();
        
        if (result && result.galleries && result.galleries.length > 0) {
          // Normalize the results to ensure they have slugs and correct image properties
          galleries = result.galleries.map((g: any) => {
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
          await filteredGalleriesCache.set(cacheKey, galleries).catch(console.error);
        }
      } catch (err) {
        console.error(`Error fetching filtered galleries for ${cacheKey}:`, err);
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
        <h1 className="text-xl font-bold text-foreground/90 capitalize">
          Most {filter} <span className="text-sm text-muted-foreground ml-2">({time})</span>
        </h1>
        <div className="flex bg-muted/30 p-0.5 rounded-sm ml-auto overflow-x-auto max-w-full">
           {VALID_TIMES.map(t => (
             <Link 
               key={t}
               href={`/pics/${filter}?time=${t}`}
               className={`px-4 py-1 text-xs font-bold rounded-sm whitespace-nowrap ${t === time ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
             >
               {t.charAt(0).toUpperCase() + t.slice(1).replace('-', ' ')}
             </Link>
           ))}
        </div>
      </div>

      {/* Dense Gallery Grid with Infinite Scroll */}
      <InfiniteGallery 
        initialGalleries={galleries} 
        filter={filter} 
        time={time} 
      />
      
      {galleries.length === 0 && (
        <div className="col-span-full py-20 text-center text-muted-foreground font-medium">
          No galleries found for this filter.
        </div>
      )}
    </div>
  );
}
