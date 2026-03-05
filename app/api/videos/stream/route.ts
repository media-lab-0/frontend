/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { adultDataLink } from '@/lib/adultdatalink';
import { checkQuota, incrementQuota } from '@/lib/quota';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  const source = searchParams.get('source') || 'letsjerktv';
  const id = searchParams.get('id') || '';

  if (!url && !id) {
    return NextResponse.json({ error: 'Missing url or id' }, { status: 400 });
  }

  try {
    const hasQuota = await checkQuota();
    if (!hasQuota) {
      return NextResponse.json({ error: 'API quota exceeded' }, { status: 429 });
    }

    let videoData: any = null;

    if (source === 'letsjerktv' && url) {
      try {
        const raw = await adultDataLink.letsjerktv.getVideoInfo(url);
        await incrementQuota();

        // Map the exact letsjerktv response format
        videoData = {
          title: raw?.title || '',
          thumbnail: raw?.thumbnail || '',
          embed_url: raw?.iframe_src || raw?.embed_url || null,
          download_url: raw?.download_url || null,
          tags: raw?.tags || [],
          categories: raw?.categories || [],
          related_videos: (raw?.related_videos || []).map((v: any) => ({
            id: (v.video_link || '').split('/').filter(Boolean).pop() || '',
            title: v.title || '',
            thumbnail: v.thumbnail || '',
            url: v.video_link || '',
            duration: v.duration || '',
            rating: v.rating || '',
            quality: v.quality || '',
            source: 'letsjerktv',
          })),
        };
      } catch (err: any) {
        console.error('[Video Stream] letsjerktv error:', err.message);
      }
    } else if (source === 'eporner' && id) {
      try {
        videoData = await adultDataLink.eporner.getVideo(id);
        await incrementQuota();
      } catch { /* fallback */ }
    } else if (source === 'redtube' && id) {
      try {
        videoData = await adultDataLink.redtube.getVideo(id);
        await incrementQuota();
      } catch { /* fallback */ }
    } else if (source === 'xhamster' && url) {
      try {
        videoData = await adultDataLink.xhamster.getVideoInfo(url);
        await incrementQuota();
      } catch { /* fallback */ }
    }

    // Fallback: generic stream-video for non-letsjerktv or failed requests
    if (!videoData?.embed_url && !videoData?.stream_url && url) {
      try {
        const streamData = await adultDataLink.functions.streamVideo(url);
        await incrementQuota();
        if (streamData) {
          videoData = {
            ...(videoData || {}),
            stream_url: streamData.stream_url || streamData.url || streamData.video_url || null,
            embed_url: streamData.embed || streamData.embed_url || null,
          };
        }
      } catch (err: any) {
        console.error('[Video Stream] stream-video error:', err.message);
      }
    }

    if (!videoData) {
      return NextResponse.json({ error: 'Could not fetch video data' }, { status: 404 });
    }

    return NextResponse.json(videoData);
  } catch (error: any) {
    console.error('[Video Stream] Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
