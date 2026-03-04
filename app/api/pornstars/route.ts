
import { NextResponse } from 'next/server';
import { adultDataLink } from '@/lib/adultdatalink';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  const params = {
    orientation: searchParams.get('orientation') || undefined,
    gender: searchParams.get('gender') || undefined,
    body: searchParams.get('body') || undefined,
    hair: searchParams.get('hair') || undefined,
    tits: searchParams.get('tits') || undefined,
    ethnicity: searchParams.get('ethnicity') || undefined,
    nationality: searchParams.get('nationality') || undefined,
    age: searchParams.get('age') || undefined,
    sort: searchParams.get('sort') || 'popular',
    page: parseInt(searchParams.get('page') || '1', 10),
  };

  try {
    const data = await adultDataLink.pornpics.getPornstars(params);
    return NextResponse.json(data);
  } catch (error) {
    console.error('API Error (Pornstars):', error);
    return NextResponse.json({ error: 'Failed to fetch pornstars' }, { status: 500 });
  }
}
