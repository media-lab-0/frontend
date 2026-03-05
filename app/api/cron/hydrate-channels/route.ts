/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { adultDataLink } from '@/lib/adultdatalink';
import { checkQuota, incrementQuota } from '@/lib/quota';

// Processes a small batch of channels per invocation (3 channels)
// Each channel = 1 API call -> search by channel name to get gallery count
// Call this endpoint periodically (e.g., every 5 minutes via cron)
const BATCH_SIZE = 3;

export async function GET() {
  try {
    // 1. Ensure gallery_count column exists
    await sql`
      ALTER TABLE tags ADD COLUMN IF NOT EXISTS gallery_count INT DEFAULT 0
    `;

    // 2. Find channels that haven't been hydrated yet (gallery_count = 0 or NULL)
    const channels = await sql`
      SELECT id, name, slug, image_url
      FROM tags
      WHERE type = 'channel' 
        AND (gallery_count IS NULL OR gallery_count = 0)
      ORDER BY name ASC
      LIMIT ${BATCH_SIZE}
    `;

    if (channels.length === 0) {
      return NextResponse.json({ 
        message: 'All channels hydrated', 
        processed: 0,
        remaining: 0 
      });
    }

    // 3. Get remaining count for progress tracking
    const remainingResult = await sql`
      SELECT COUNT(*) as cnt FROM tags 
      WHERE type = 'channel' AND (gallery_count IS NULL OR gallery_count = 0)
    `;
    const remaining = parseInt(remainingResult[0]?.cnt || '0', 10);

    const results: any[] = [];

    // 4. Process each channel
    for (const channel of channels) {
      const hasQuota = await checkQuota();
      if (!hasQuota) {
        results.push({ name: channel.name, status: 'skipped', reason: 'quota_exceeded' });
        break;
      }

      try {
        // Search for the channel name to get gallery results + count
        const searchData = await adultDataLink.pornpics.search(channel.name, 0, 1);
        await incrementQuota();

        const galleryCount = searchData?.total_count || searchData?.posts?.length || 0;
        const firstImage = searchData?.posts?.[0]?.image_url || null;

        // Update the channel with the count + image if missing
        if (firstImage && !channel.image_url) {
          await sql`
            UPDATE tags 
            SET gallery_count = ${galleryCount}, image_url = ${firstImage}
            WHERE id = ${channel.id}
          `;
        } else {
          await sql`
            UPDATE tags 
            SET gallery_count = ${galleryCount}
            WHERE id = ${channel.id}
          `;
        }

        results.push({ 
          name: channel.name, 
          status: 'ok', 
          gallery_count: galleryCount,
          image_updated: !channel.image_url && !!firstImage
        });

        // Small delay between API calls to be kind to the API
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (err: any) {
        // On error, set count to -1 so we skip it next time
        await sql`
          UPDATE tags SET gallery_count = -1 WHERE id = ${channel.id}
        `;
        results.push({ name: channel.name, status: 'error', error: err.message });
      }
    }

    return NextResponse.json({ 
      message: `Processed ${results.length} channels`,
      processed: results.length,
      remaining: remaining - results.length,
      results 
    });

  } catch (error: any) {
    console.error('[Hydrate Channels] Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
