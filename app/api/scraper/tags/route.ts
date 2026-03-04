import { NextResponse } from "next/server";
import { adultDataLink } from "@/lib/adultdatalink";
import { sql } from "@/lib/db";
import { checkQuota, incrementQuota } from "@/lib/quota";

export async function GET() {
  try {
    // 1. DB-First Cache Check
    const result = await sql`SELECT count(*) FROM tags`;
    const count = parseInt(result[0].count);
    
    // If we already have tags, don't waste API calls for now
    if (count > 0) {
      return NextResponse.json({
        success: true,
        message: `Served from Cache. DB already contains ${count} tags.`,
      });
    }

    // 2. Quota Check
    const hasQuota = await checkQuota();
    if (!hasQuota) {
      return NextResponse.json({ success: false, error: "Daily API quota reached (1,000/day)" }, { status: 429 });
    }

    // 3. API Fetch
    const response = await adultDataLink.pornpics.getTags();
    await incrementQuota();

    const tagsScraped = response.map((tag: any) => [
      tag.name,
      tag.slug,
      'tag'
    ]);

    // 4. Batch Insert into DB
    if (tagsScraped.length > 0) {
      await sql`
        INSERT INTO tags (name, slug, type)
        VALUES ${sql(tagsScraped)}
        ON CONFLICT (slug) DO NOTHING
      `;
    }

    return NextResponse.json({
      success: true,
      message: `Scraped ${tagsScraped.length} tags via AdultDataLink API.`,
      tags: tagsScraped.slice(0, 5).map((t: any) => ({ name: t[0], slug: t[1] })),
    });

  } catch (err: any) {
    console.error("Scraper Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
