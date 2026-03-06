/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { adultDataLink } from '@/lib/adultdatalink';
import { checkQuota, incrementQuota } from '@/lib/quota';
import { sql } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filter = searchParams.get('filter');
  const tag = searchParams.get('tag'); // slug
  const tagName = searchParams.get('tagName'); // display name for search
  const time = searchParams.get('time') || 'weekly';
  const offset = parseInt(searchParams.get('offset') || '0', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);

  try {
    let galleries: any[] = [];

    const getHighResImage = (url: string) => {
      if (!url) return null;
      return url.replace(/-\d+[xX]\d+(?=\.[a-zA-Z]+$)/, '');
    };

    // 1. Try Cache (Selective for offsets)
    // For now, let's keep it simple and fetch fresh if offset > 0 to avoid complex pagination cache management
    // but we could cache specific pages if needed.

    // 2. Fetch from API
    const hasQuota = await checkQuota();
    if (!hasQuota) {
      return NextResponse.json({ error: 'Quota exceeded' }, { status: 429 });
    }

    if (tagName) {
      const result = await adultDataLink.pornpics.search(tagName, offset, limit);
      await incrementQuota();
      if (result && result.posts) {
        galleries = result.posts.map((g: any) => ({
          ...g,
          slug: g.slug || (g.gallery_url || g.url).split('/').filter(Boolean).pop(),
          cover_url: getHighResImage(g.image_url || g.cover_url)
        }));
      }
    } else if (filter) {
      const result = await adultDataLink.pornpics.getGalleries({ filter_type: filter, time, offset, limit });
      await incrementQuota();
      if (result && result.galleries) {
        galleries = result.galleries.map((g: any) => ({
          ...g,
          slug: g.slug || (g.gallery_url || g.url).split('/').filter(Boolean).pop(),
          cover_url: getHighResImage(g.image_url || g.cover_url)
        }));
      }
    }

    // 3. Upsert to DB if we have results
    if (galleries.length > 0) {
      const toInsert = galleries.map((g: any) => [
        g.title || g.slug.replace(/-/g, ' '),
        g.slug,
        g.url || g.gallery_url || `https://www.pornpics.com/galleries/${g.slug}/`,
        g.cover_url,
        new Date().toISOString()
      ]);
      
      try {
        await sql`
          INSERT INTO galleries (title, slug, url, cover_url, last_scraped_at)
          VALUES ${sql(toInsert)}
          ON CONFLICT (slug) DO UPDATE SET 
            title = EXCLUDED.title,
            cover_url = EXCLUDED.cover_url,
            last_scraped_at = EXCLUDED.last_scraped_at
        `;
      } catch (err: any) {
        console.error("Gallery API DB Sync Error:", err.message);
      }
    }

    return NextResponse.json({ galleries });
  } catch (error: any) {
    console.error(`[Galleries API] Critical Error (${filter || tag}):`, error.message);
    return NextResponse.json({ error: 'Failed to fetch galleries' }, { status: 500 });
  }
}
