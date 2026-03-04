import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const offset = parseInt(searchParams.get('offset') || '0', 10);
  const limit = parseInt(searchParams.get('limit') || '40', 10);

  try {
    const categories = await sql`
      SELECT name, slug, image_url, is_popular 
      FROM tags 
      WHERE is_category = true 
        AND image_url IS NOT NULL
      ORDER BY is_popular DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Categories API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}
