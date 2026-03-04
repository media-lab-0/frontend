
import { NextResponse } from 'next/server';
import { adultDataLink } from '@/lib/adultdatalink';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;

  try {
    const decodedName = decodeURIComponent(name);
    const data = await adultDataLink.pornstar.getPornstarData(decodedName);
    return NextResponse.json(data);
  } catch (error) {
    console.error(`API Error (Pornstar ${name}):`, error);
    return NextResponse.json({ error: 'Failed to fetch pornstar data' }, { status: 500 });
  }
}
