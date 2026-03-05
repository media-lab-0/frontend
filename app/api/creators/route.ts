/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { adultDataLink } from '@/lib/adultdatalink';
import { checkQuota, incrementQuota } from '@/lib/quota';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const offset = parseInt(searchParams.get('offset') || '0', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);

  try {
    const hasQuota = await checkQuota();
    if (!hasQuota) {
      return NextResponse.json({ creators: [], hasMore: false });
    }

    const data = await adultDataLink.pornpics.search('onlyfans', offset, limit);
    await incrementQuota();

    if (data && data.posts) {
      const creators = data.posts.map((g: any) => {
        // Extract model name from title
        const title = g.title || '';
        // Common patterns: "X from OnlyFans", "OnlyFans model X", "X OnlyFans"
        let name = title
          .replace(/\s*nude\s*pics$/i, '')
          .replace(/\s*naked\s*pics$/i, '')
          .replace(/\s*porn\s*pics$/i, '')
          .replace(/\s*nude\s*pictures$/i, '')
          .replace(/\s*nude\s*photos$/i, '')
          .replace(/\s*images$/i, '')
          .replace(/\s*hot\s*xxx$/i, '')
          .trim();

        return {
          name: name || title,
          slug: g.slug || (g.gallery_url || g.url || '').split('/').filter(Boolean).pop(),
          image_url: g.image_url || g.cover_url,
          gallery_url: g.gallery_url || g.url
        };
      });

      return NextResponse.json({ 
        creators, 
        hasMore: creators.length >= limit 
      });
    }

    return NextResponse.json({ creators: [], hasMore: false });
  } catch (error: any) {
    console.error('[Creators API] Error:', error.message);
    return NextResponse.json({ error: 'Failed to fetch creators' }, { status: 500 });
  }
}
