/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { adultDataLink } from '@/lib/adultdatalink';
import { sql } from '@/lib/db';
import { checkQuota, incrementQuota } from '@/lib/quota';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim();

  if (!q) {
    return NextResponse.json({ error: 'Missing query' }, { status: 400 });
  }

  try {
    const results: any = { query: q, galleries: [], model: null, categories: [], channels: [], relatedModels: [] };

    // 1. Search local DB first (fast, no quota)
    const dbTags = await sql`
      SELECT name, slug, type, image_url, is_category
      FROM tags 
      WHERE name ILIKE ${'%' + q + '%'}
      ORDER BY 
        CASE WHEN type = 'model' THEN 0 WHEN type = 'channel' THEN 1 ELSE 2 END,
        name ASC
      LIMIT 20
    `;

    dbTags.forEach((t: any) => {
      const item = { name: t.name, slug: t.slug, image_url: t.image_url };
      if (t.type === 'channel') results.channels.push(item);
      else if (t.is_category) results.categories.push(item);
      else results.categories.push(item);
    });

    // 2. Try to fetch pornstar profile data — ONLY if query looks like a name
    //    (2+ words, each starting with uppercase) and NOT a known category/tag
    const words = q.split(/\s+/);
    const looksLikeName = words.length >= 2 && words.every(w => /^[A-Z]/.test(w));
    const isKnownCategory = results.categories.length > 0 && 
      results.categories.some((c: any) => c.name.toLowerCase() === q.toLowerCase());
    
    if (looksLikeName && !isKnownCategory) {
      const hasQuota1 = await checkQuota();
      if (hasQuota1) {
        try {
          const pornstarData = await adultDataLink.pornstar.getPornstarData(q);
          await incrementQuota();
          if (pornstarData && pornstarData.name) {
            results.model = {
              name: pornstarData.name,
              slug: pornstarData.name.toLowerCase().replace(/\s+/g, '-'),
              image_url: pornstarData.avatar || pornstarData.image_url || null,
              age: pornstarData.age || null,
              galleries_count: pornstarData.total_video_count || 0,
              ethnicity: pornstarData.ethnicity || null,
              nationality: pornstarData.nationality || null,
            };

            // Fetch related models from the pornstar page
            if (pornstarData.related_pornstars && Array.isArray(pornstarData.related_pornstars)) {
              results.relatedModels = pornstarData.related_pornstars.slice(0, 12).map((r: any) => ({
                name: r.name || r,
                slug: (r.name || r).toLowerCase().replace(/\s+/g, '-')
              }));
            }
          }
        } catch {
          // Not a known pornstar — that's fine, we'll show galleries only
        }
      }
    }

    // 3. Search galleries from API
    const hasQuota2 = await checkQuota();
    if (hasQuota2) {
      const apiResult = await adultDataLink.pornpics.search(q, 0, 30);
      await incrementQuota();

      if (apiResult && apiResult.posts) {
        results.galleries = apiResult.posts.map((g: any) => ({
          title: g.title,
          slug: g.slug || (g.gallery_url || g.url || '').split('/').filter(Boolean).pop(),
          cover_url: g.image_url || g.cover_url,
          url: g.gallery_url || g.url
        }));
      }
    }

    return NextResponse.json(results);
  } catch (error: any) {
    console.error('[Search API] Error:', error.message);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
