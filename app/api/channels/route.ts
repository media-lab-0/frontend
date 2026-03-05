/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const alphabet = searchParams.get('alphabet');
  const offset = parseInt(searchParams.get('offset') || '0', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  
  try {
    let channels;
    if (alphabet) {
      channels = await sql`
        SELECT 
          t.name, 
          t.slug, 
          t.image_url,
          COALESCE(t.gallery_count, (SELECT COUNT(*) FROM gallery_tags gt WHERE gt.tag_id = t.id)::int) as gallery_count
        FROM tags t
        WHERE t.type = 'channel' AND t.name ILIKE ${alphabet + '%'}
        ORDER BY COALESCE(t.gallery_count, 0) DESC, t.name ASC
        OFFSET ${offset} LIMIT ${limit}
      `;
    } else {
      channels = await sql`
        SELECT 
          t.name, 
          t.slug, 
          t.image_url,
          COALESCE(t.gallery_count, (SELECT COUNT(*) FROM gallery_tags gt WHERE gt.tag_id = t.id)::int) as gallery_count
        FROM tags t
        WHERE t.type = 'channel'
        ORDER BY COALESCE(t.gallery_count, 0) DESC, t.name ASC
        OFFSET ${offset} LIMIT ${limit}
      `;
    }

    return NextResponse.json({ 
      channels, 
      hasMore: channels.length >= limit 
    });
  } catch (error: any) {
    // If gallery_count column doesn't exist yet, fallback
    if (error.message?.includes('gallery_count')) {
      try {
        const fallback = await sql`
          SELECT 
            t.name, t.slug, t.image_url,
            (SELECT COUNT(*) FROM gallery_tags gt WHERE gt.tag_id = t.id)::int as gallery_count
          FROM tags t
          WHERE t.type = 'channel'
          ORDER BY gallery_count DESC, t.name ASC
          OFFSET ${offset} LIMIT ${limit}
        `;
        return NextResponse.json({ channels: fallback, hasMore: fallback.length >= limit });
      } catch (e2: any) {
        return NextResponse.json({ error: e2.message }, { status: 500 });
      }
    }
    console.error('Channels List API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
