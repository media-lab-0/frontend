/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { adultDataLink } from '@/lib/adultdatalink';
import { checkQuota, incrementQuota } from '@/lib/quota';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const source = searchParams.get('source') || 'letsjerktv';
  const category = searchParams.get('category') || '';
  const pornstar = searchParams.get('pornstar') || '';
  const mode = searchParams.get('mode') || 'feed'; // feed | categories | pornstars

  try {
    const hasQuota = await checkQuota();
    if (!hasQuota) {
      return NextResponse.json({ videos: [], hasMore: false, error: 'API quota exceeded' });
    }

    let videos: any[] = [];
    let hasMore = false;
    let categories: any[] = [];
    let pornstars: any[] = [];

    if (source === 'letsjerktv') {
      // --- LetsJerkTV ---
      if (mode === 'categories') {
        // Fetch category list
        const data = await adultDataLink.letsjerktv.getCategories();
        await incrementQuota();
        categories = data?.categories || data || [];
        return NextResponse.json({ categories });
      }

      if (mode === 'pornstars') {
        // Fetch pornstar list
        const data = await adultDataLink.letsjerktv.getPornstars({ page });
        await incrementQuota();
        pornstars = data?.pornstars || data || [];
        return NextResponse.json({ pornstars, hasMore: pornstars.length >= 20 });
      }

      if (pornstar) {
        // Fetch videos for a specific pornstar
        const data = await adultDataLink.letsjerktv.getPornstarVideos({ pornstar, page });
        await incrementQuota();
        videos = normalizeLetsjerktvVideos(data);
        hasMore = videos.length >= 20;
      } else if (category) {
        // Fetch videos for a specific category
        const data = await adultDataLink.letsjerktv.getCategoryVideos({ category, page });
        await incrementQuota();
        videos = normalizeLetsjerktvVideos(data);
        hasMore = videos.length >= 20;
      } else if (query) {
        // Search
        const data = await adultDataLink.letsjerktv.search({ query, page });
        await incrementQuota();
        videos = normalizeLetsjerktvVideos(data);
        hasMore = videos.length >= 20;
      } else {
        // Default: feed
        const data = await adultDataLink.letsjerktv.getFeed({ page });
        await incrementQuota();
        videos = normalizeLetsjerktvVideos(data);
        hasMore = videos.length >= 20;
      }

    } else if (source === 'eporner') {
      const params: any = { page, per_page: 24, order: 'latest' };
      if (query) params.query = query;
      if (category) params.query = (params.query ? params.query + ' ' : '') + category;
      
      const data = await adultDataLink.eporner.search(params);
      await incrementQuota();

      if (data && data.videos) {
        videos = data.videos.map((v: any) => ({
          id: v.id || v.ep_id,
          title: v.title,
          thumbnail: v.default_thumb?.src || v.thumb || v.thumbs?.[0]?.src || '',
          duration: v.length_sec ? formatDuration(v.length_sec) : v.length_min || '',
          views: v.views || 0,
          rating: v.rate || 0,
          url: v.url || v.ep_url || '',
          source: 'eporner',
          added: v.added || '',
        }));
        hasMore = (data.total_pages || 0) > page;
      }
    } else if (source === 'xhamster') {
      const params: any = { page };
      if (query) params.query = query;
      if (category) params.category = category;
      
      const data = query 
        ? await adultDataLink.xhamster.search(params)
        : await adultDataLink.xhamster.getVideos(params);
      await incrementQuota();

      if (data && data.videos) {
        videos = data.videos.map((v: any) => ({
          id: v.id || v.xhamster_id || '',
          title: v.title,
          thumbnail: v.thumb || v.thumbnail || v.thumbURL || '',
          duration: v.duration || '',
          views: v.views || 0,
          rating: v.rating || 0,
          url: v.url || v.pageURL || '',
          source: 'xhamster',
          added: v.created || '',
        }));
        hasMore = videos.length >= 20;
      }
    } else if (source === 'redtube') {
      const params: any = { page };
      if (query) params.query = query;
      if (category) params.category = category;
      
      const data = await adultDataLink.redtube.search(params);
      await incrementQuota();

      if (data && data.videos) {
        videos = data.videos.map((v: any) => {
          const vid = v.video || v;
          return {
            id: vid.video_id || vid.id || '',
            title: vid.title,
            thumbnail: vid.default_thumb || vid.thumb || vid.thumbnail || '',
            duration: vid.duration || '',
            views: vid.views || 0,
            rating: vid.rating || 0,
            url: vid.url || '',
            source: 'redtube',
            added: vid.publish_date || '',
          };
        });
        hasMore = videos.length >= 20;
      }
    }

    return NextResponse.json({ videos, hasMore, page });
  } catch (error: any) {
    console.error('[Videos API] Error:', error.message);
    return NextResponse.json({ videos: [], hasMore: false, error: error.message }, { status: 500 });
  }
}

function normalizeLetsjerktvVideos(data: any): any[] {
  const raw = data?.videos || data?.results || (Array.isArray(data) ? data : []);
  
  // Debug: log first item's keys to understand the structure
  if (raw.length > 0) {
    console.log('[Videos API] letsjerktv feed item keys:', Object.keys(raw[0]));
    console.log('[Videos API] letsjerktv first item sample:', JSON.stringify(raw[0]).slice(0, 500));
  }

  return raw.map((v: any) => {
    const videoUrl = v.video_link || v.url || v.video_url || v.link || v.href || '';
    const slug = videoUrl ? videoUrl.split('/').filter(Boolean).pop() || '' : '';
    return {
      id: v.id || v.video_id || slug || '',
      title: v.title || v.name || '',
      thumbnail: v.thumbnail || v.thumb || v.preview || v.image || v.poster || '',
      duration: v.duration || v.length || '',
      views: v.views || v.view_count || 0,
      rating: v.rating || v.likes || 0,
      url: videoUrl,
      source: 'letsjerktv',
      added: v.added || v.date || v.publish_date || '',
      quality: v.quality || '',
      pornstar: v.pornstar || v.model || null,
      categories: v.categories || v.tags || [],
    };
  });
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
