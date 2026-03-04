import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  try {
    const networks = await sql`
      SELECT name, slug 
      FROM tags 
      WHERE type = 'channel' 
      ORDER BY name ASC
    `;
    
    const categories = await sql`
      SELECT name, slug 
      FROM tags 
      WHERE is_category = true AND is_popular = true 
      ORDER BY name ASC
    `;

    return NextResponse.json({
      networks,
      categories
    });
  } catch (error: any) {
    console.error('Channel Filters API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch filter data' }, { status: 500 });
  }
}
