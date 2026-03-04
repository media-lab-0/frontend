import { NextResponse } from 'next/server';
import { ingestionService } from '@/lib/ingestion';

export async function GET() {
  try {
    console.log("Starting background smart hydration...");
    ingestionService.runSmartHydration().catch(console.error);
    
    return NextResponse.json({ success: true, message: "Started background smart hydration for all tags." });
  } catch (error) {
    console.error("Sync API Error:", error);
    return NextResponse.json({ success: false, error: 'Failed to start sync' }, { status: 500 });
  }
}
