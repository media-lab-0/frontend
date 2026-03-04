import { adultDataLink } from './lib/adultdatalink';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function checkTags() {
    try {
        console.log('Fetching all tags...');
        const tags = await adultDataLink.pornpics.getTags();
        console.log(`Total tags received: ${tags.length}`);
        
        // Look for items that look like channels: "Name (Count)"
        const channels = tags.filter((t: any) => t.name && t.name.includes('(') && t.name.includes(')'));
        console.log(`Potential channel-like tags: ${channels.length}`);
        
        channels.slice(0, 10).forEach((c: any) => {
            console.log(`- ${c.name} (Slug: ${c.slug})`);
        });

    } catch (e: any) {
        console.error('API fail:', e.message);
    }
    process.exit();
}

checkTags();
