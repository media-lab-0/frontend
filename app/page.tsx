/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
import { sql } from '@/lib/db';
import { categoryCache, redis } from '@/lib/redis';
import { CategoryGrid } from '@/components/gallery/CategoryGrid';
// Helpers to shuffle data outside the render cycle
const extractRandomRedisKeys = (keys: string[], limit: number) => {
  const shuffled = [...keys];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, limit);
};

export default async function Home() {
  // 1. Try fetching from Redis first for extremely fast loading
  let categories: any[] = [];
  try {
    const cached = await redis.keys('homecat:*');
    if (cached && cached.length > 50) {
      // Fetch a bunch of them (Redis is fast)
      const randomKeys = extractRandomRedisKeys(cached, 150);
      const pipeline = redis.pipeline();
      randomKeys.forEach(k => pipeline.get(k));
      const results = await pipeline.exec();
      categories = results.filter(Boolean).map((cat: any, index: number) => {
        // Handle existing cache entries that might be missing the slug
        if (!cat.slug) {
           cat.slug = randomKeys[index].replace('homecat:', '');
        }
        return cat;
      }) as any[];
    }
  } catch (err) {
    console.error("Redis Cache Error:", err);
  }

  // 2. Fallback to SQL if Redis is empty or fails
  if (categories.length < 50) {
    try {
      const dbTags = await sql`
        SELECT name, slug, image_url, is_popular 
        FROM tags 
        WHERE is_category = true 
          AND image_url IS NOT NULL 
          AND name IS NOT NULL
        ORDER BY is_popular DESC
        LIMIT 3000
      `;
      
      if (dbTags && dbTags.length > 0) {
        // Filter out any potential empty or undefined values
        const validTags = dbTags.filter((t: any) => t.name && t.slug && t.image_url);
        categories = validTags;
        // Background populate Redis (don't await for faster response)
        categoryCache.setAll(validTags as any[]).catch(console.error);
      }
    } catch (err) {
      console.error("SQL Fallback Error:", err);
    }
  }

  // Remove blocking hydration from here. It should be triggered manually via /api/sync or a background cron.

  return (
    <div className="flex-1 flex flex-col w-full max-w-[1600px] mx-auto px-2 md:px-4 py-6 bg-background">
      
      {/* Header section matching the screenshot style */}
      <div className="flex items-center gap-2 mb-6 px-2">
        <h1 className="text-xl font-bold text-foreground/90">Top Porn Categories</h1>
        <div className="flex bg-muted/30 p-0.5 rounded-sm">
           <button className="px-4 py-1 text-xs font-bold bg-background text-foreground shadow-sm rounded-sm">Popular</button>
           <button className="px-4 py-1 text-xs font-bold text-muted-foreground hover:text-foreground">List</button>
        </div>
      </div>

      {/* Dense Category Grid (Auto-Load enabled) */}
      <CategoryGrid initialCategories={categories} />
    </div>
  );
}