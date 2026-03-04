import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const alphabet = searchParams.get('alphabet');
  
  try {
    let channels;
    if (alphabet) {
      channels = await sql`
        SELECT 
          t.name, 
          t.slug, 
          t.image_url,
          (SELECT COUNT(*) FROM gallery_tags gt WHERE gt.tag_id = t.id) as gallery_count
        FROM tags t
        WHERE t.type = 'channel' AND t.name ILIKE ${alphabet + '%'}
        ORDER BY gallery_count DESC, t.name ASC
      `;
    } else {
      channels = await sql`
        SELECT 
          t.name, 
          t.slug, 
          t.image_url,
          (SELECT COUNT(*) FROM gallery_tags gt WHERE gt.tag_id = t.id) as gallery_count
        FROM tags t
        WHERE t.type = 'channel'
        ORDER BY gallery_count DESC, t.name ASC
      `;
    }

    return NextResponse.json({ channels });
  } catch (error: any) {
    console.error('Channels List API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
