/* eslint-disable @typescript-eslint/no-explicit-any */
import { adultDataLink } from './adultdatalink';
import { sql } from './db';
import { checkQuota, incrementQuota } from './quota';
import { categoryCache } from './redis';
import * as cheerio from 'cheerio';
import axios from 'axios';

export const ingestionService = {
  /**
   * Hydrates all available tags from the API.
   */
  async hydrateTags() {
    const hasQuota = await checkQuota();
    if (!hasQuota) return;

    try {
      console.log("🟡 Hydrating tags from API...");
      const response = await adultDataLink.pornpics.getTags();
      await incrementQuota();

      if (response && typeof response === 'object') {
        const tagNames = Object.values(response) as string[];
        
        // Prepare tags and generate slugs, spreading categories evenly across alphabet
        const tagsScraped = tagNames.map((name, index) => {
          const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
          // Pick ~10% of tags pseudo-randomly but deterministically to be featured categories across the whole A-Z list
          const hash = slug.length + name.charCodeAt(0) + name.charCodeAt(name.length - 1);
          const isCategory = hash % 8 === 0 || index < 50; 
          
          return [
            name,
            slug,
            'tag', // default type
            isCategory, 
            hash % 15 === 0 // is_popular
          ];
        });

        // Upsert in batches of 1000 to avoid request size limits
        for (let i = 0; i < tagsScraped.length; i += 1000) {
          const batch = tagsScraped.slice(i, i + 1000);
          await sql`
            INSERT INTO tags (name, slug, type, is_category, is_popular)
            VALUES ${sql(batch as any)}
            ON CONFLICT (slug) DO NOTHING
          `;
        }
        
        console.log(`✅ Hydrated ${tagsScraped.length} tags.`);
        
      }
    } catch (err) {
      console.error("Ingestion Error (Tags):", err);
    }
  },

  /**
   * Hydrates the latest galleries.
   */
  async hydrateLatestGalleries() {
    const hasQuota = await checkQuota();
    if (!hasQuota) return;

    try {
      const galleries = await adultDataLink.pornpics.getGalleries({ offset: 0, limit: 40 });
      await incrementQuota();

      if (galleries && galleries.length > 0) {
        const toInsert = galleries.map((g: any) => [
          g.title,
          g.slug,
          g.url,
          g.cover_url,
          new Date().toISOString()
        ]);

        await sql`
          INSERT INTO galleries (title, slug, url, cover_url, last_scraped_at)
          VALUES ${sql(toInsert)}
          ON CONFLICT (slug) DO UPDATE SET 
            title = EXCLUDED.title,
            cover_url = EXCLUDED.cover_url,
            last_scraped_at = EXCLUDED.last_scraped_at
        `;
      }
    } catch (err) {
      console.error("Ingestion Error (Latest Galleries):", err);
    }
  },

  /**
   * Hydrates galleries for a specific tag.
   */
  async hydrateTagGalleries(tagId: string, slug: string) {
    const hasQuota = await checkQuota();
    if (!hasQuota) return;

    try {
      const galleries = await adultDataLink.pornpics.getGalleries({ category: slug, offset: 0, limit: 40 });
      await incrementQuota();

      if (galleries && galleries.length > 0) {
        const toInsert = galleries.map((g: any) => [
          g.title,
          g.slug,
          g.url,
          g.cover_url,
          new Date().toISOString()
        ]);

        const inserted = await sql`
          INSERT INTO galleries (title, slug, url, cover_url, last_scraped_at)
          VALUES ${sql(toInsert)}
          ON CONFLICT (slug) DO UPDATE SET 
            title = EXCLUDED.title,
            cover_url = EXCLUDED.cover_url,
            last_scraped_at = EXCLUDED.last_scraped_at
          RETURNING id
        `;

        if (inserted && inserted.length > 0) {
          const linkages = inserted.map((g: any) => [g.id, tagId]);
          await sql`
            INSERT INTO gallery_tags (gallery_id, tag_id)
            VALUES ${sql(linkages)}
            ON CONFLICT (gallery_id, tag_id) DO NOTHING
          `;
        }
      }

      await sql`
        UPDATE tags SET last_scraped_at = ${new Date().toISOString()} WHERE id = ${tagId}
      `;
    } catch (err) {
      console.error(`Ingestion Error (Tag ${slug}):`, err);
    }
  },

  /**
   * Phase 1: Scrape Homepage for top categories (0 Quota)
   */
  async scrapeHomepageCategories() {
    try {
      console.log("🔵 Scraping PornPics homepage for categories...");
      const { data: html } = await axios.get('https://www.pornpics.com/', {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
      });
      const $ = cheerio.load(html);
      const categoryPairs: { name: string; slug: string; image_url: string }[] = [];

      $('.top-categories-list li a').each((_, el) => {
        const name = $(el).find('span').text().trim();
        const href = $(el).attr('href') || '';
        const img = $(el).find('img').attr('src') || $(el).find('img').attr('data-src');
        
        if (name && href && img) {
          const slug = href.split('/').filter(Boolean).pop() || '';
          categoryPairs.push({ name, slug, image_url: img });
        }
      });

      console.log(`Found ${categoryPairs.length} categories on homepage.`);
      
      for (const cat of categoryPairs) {
        await sql`
          UPDATE tags SET image_url = ${cat.image_url}, is_category = true WHERE slug = ${cat.slug}
        `;
        await categoryCache.set(cat.slug, { name: cat.name, image_url: cat.image_url });
      }
      return categoryPairs.length;
    } catch (err) {
      console.error("Scraping Homepage Error:", err);
      return 0;
    }
  },

  /**
   * Phase 2: Scrape Channels for studio thumbnails (0 Quota)
   */
  /**
   * Phase 2 [BACKUP]: Hydrate Channels via API search (when direct scraping is blocked)
   */
  async hydrateChannelsFromAPI() {
    try {
      console.log("🔵 Hydrating channels via API search discovery...");
      const response = await adultDataLink.pornpics.search('channels', 0, 100);
      
      if (!response || !response.posts) return 0;

      const channelData: [string, string, string, string][] = [];
      response.posts.forEach((p: any) => {
        // Extract channel slug from gallery_url if it's a channel link
        // gallery_url usually looks like "/channels/onlyfans/"
        const url = p.gallery_url || '';
        if (url.includes('/channels/')) {
          const slug = url.split('/').filter(Boolean).pop() || '';
          const name = p.title || slug.replace(/-/g, ' ');
          const img = p.image_url || '';
          channelData.push([name, slug, 'channel', img]);
        }
      });

      console.log(`Discovered ${channelData.length} channels from API search.`);

      if (channelData.length > 0) {
        await sql`
          INSERT INTO tags (name, slug, type, image_url)
          VALUES ${sql(channelData)}
          ON CONFLICT (slug) DO UPDATE SET 
            type = 'channel',
            image_url = EXCLUDED.image_url,
            name = CASE WHEN tags.name = '' OR tags.name IS NULL THEN EXCLUDED.name ELSE tags.name END
        `;
      }
      return channelData.length;
    } catch (err) {
      console.error("Hydrate Channels API Error:", err);
      return 0;
    }
  },

  async scrapeChannels() {
    try {
      console.log("🔵 Scraping PornPics channels for discovery...");
      const { data: html } = await axios.get('https://www.pornpics.com/channels/', {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
      });
      const $ = cheerio.load(html);
      const channelData: [string, string, string, string][] = [];

      $('.channel-list li a').each((_, el) => {
        const href = $(el).attr('href') || '';
        const img = $(el).find('img').attr('src') || $(el).find('img').attr('data-src') || '';
        const name = $(el).text().trim() || $(el).find('img').attr('alt')?.replace(' Pics', '').trim() || '';
        
        if (href && img && name) {
          const slug = href.split('/').filter(Boolean).pop() || '';
          // [name, slug, type, image_url]
          channelData.push([name, slug, 'channel', img]);
        }
      });

      console.log(`Found ${channelData.length} channels.`);

      if (channelData.length > 0) {
        // Upsert in batches
        for (let i = 0; i < channelData.length; i += 500) {
          const batch = channelData.slice(i, i + 500);
          await sql`
            INSERT INTO tags (name, slug, type, image_url)
            VALUES ${sql(batch)}
            ON CONFLICT (slug) DO UPDATE SET 
              type = 'channel',
              image_url = EXCLUDED.image_url,
              name = CASE WHEN tags.name = '' OR tags.name IS NULL THEN EXCLUDED.name ELSE tags.name END
          `;
        }
      }
      return channelData.length;
    } catch (err) {
      console.error("Scraping Channels Error:", err);
      return 0;
    }
  },

  /**
   * Phase 3: Scrape Pornstars for performer thumbnails (0 Quota)
   */
  async scrapePornstars() {
    try {
      console.log("🔵 Scraping PornPics pornstars...");
      // For now just the first page to minimize impact, can be expanded
      const { data: html } = await axios.get('https://www.pornpics.com/pornstars/', {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
      });
      const $ = cheerio.load(html);
      const starPairs: { slug: string; image_url: string }[] = [];

      $('.pornstar-list li a').each((_, el) => {
        const href = $(el).attr('href') || '';
        const img = $(el).find('img').attr('src') || $(el).find('img').attr('data-src');
        
        if (href && img) {
          const slug = href.split('/').filter(Boolean).pop() || '';
          starPairs.push({ slug, image_url: img });
        }
      });

      console.log(`Found ${starPairs.length} pornstars on first page.`);

      for (const star of starPairs) {
        await sql`
          UPDATE tags SET image_url = ${star.image_url} WHERE slug = ${star.slug}
        `;
      }
      return starPairs.length;
    } catch (err) {
      console.error("Scraping Pornstars Error:", err);
      return 0;
    }
  },

  /**
   * Hydrates images for categories (tags marked as is_category).
   */
  async hydrateTagImages() {
    const hasQuota = await checkQuota();
    if (!hasQuota) return;

    try {
      // 1. Fetch tags that need image hydration
      const tags = await sql`
        SELECT id, name, slug FROM tags WHERE is_category = true AND image_url IS NULL
      `;

      if (!tags || tags.length === 0) return;

      // Randomize array to fetch images uniformly across alphabet
      const randomizedTags = [...tags].sort(() => Math.random() - 0.5).slice(0, 100);

      console.log(`🟡 Hydrating images for ${randomizedTags.length} randomized categories...`);

      for (const tag of randomizedTags) {
        const hasQuota = await checkQuota();
        if (!hasQuota) break;

        try {
          const response = await adultDataLink.pornpics.search(tag.name, 0, 1);
          await incrementQuota();

          if (response && response.posts && response.posts.length > 0) {
            const imageUrl = response.posts[0].image_url;
            await sql`
              UPDATE tags SET 
                image_url = ${imageUrl},
                last_scraped_at = ${new Date().toISOString()}
              WHERE id = ${tag.id}
            `;
            
            await categoryCache.set(tag.slug, { name: tag.name, image_url: imageUrl });
          }
        } catch (err) {
          console.error(`Error hydrating image for tag ${tag.name}:`, err);
        }
      }
      
      console.log("✅ Finished hydrating tag images.");
    } catch (err) {
      console.error("Ingestion Error (Tag Images):", err);
    }
  },

  /**
   * Orchestrates the smart hydration strategy.
   */
  async runSmartHydration() {
    console.log("🚀 Starting Smart Hybrid Hydration...");
    
    // Phase 1-3: Zero Quota Scraping
    const homeCount = await this.scrapeHomepageCategories();
    const channelCount = await this.scrapeChannels();
    const starCount = await this.scrapePornstars();
    
    console.log(`Phase 1-3 complete. Scraped: ${homeCount} categories, ${channelCount} channels, ${starCount} pornstars.`);
    
    // Phase 4: API Fallback for remaining category-priority tags
    console.log("Phase 4: Targeted API hydration for missing category images...");
    await this.hydrateTagImages();
    
    console.log("✨ Smart Hydration cycle finished.");
  },

  /**
   * Hydrates images and metadata for a specific gallery.
   */
  async hydrateGalleryImages(galleryId: string, slug: string) {
    const hasQuota = await checkQuota();
    if (!hasQuota) return null;

    try {
      const galleryUrl = `https://www.pornpics.com/galleries/${slug}/`;
      console.log(`[Ingestion] Hydrating Gallery: ${slug} | URL: ${galleryUrl}`);
      const data = await adultDataLink.pornpics.getGalleryImages(galleryUrl);
      await incrementQuota();

      if (data && data.link_list && data.link_list.length > 0) {
        // 1. Process Images
        const imgToInsert = data.link_list.map((url: string) => [galleryId, url]);

        await sql`
          INSERT INTO images (gallery_id, url)
          VALUES ${sql(imgToInsert)}
          ON CONFLICT (gallery_id, url) DO NOTHING
        `;

        // 2. Process Metadata (Views, Rating)
        const updatedMeta = { 
          views: data.views || 0,
          rating: data.rating || 0,
          last_scraped_at: new Date().toISOString()
        };
        await sql`
          UPDATE galleries SET 
            views = ${updatedMeta.views},
            rating = ${updatedMeta.rating},
            last_scraped_at = ${updatedMeta.last_scraped_at}
          WHERE id = ${galleryId}
        `;

        // 3. Process Tags
        let finalTags: any[] = [];
        if (data.tags && data.tags.length > 0) {
          const galleryTags = data.tags.map((t: string[]) => {
            const href = t[0]; 
            const name = t[1].replace(/ Pics$/i, ''); 
            const tagSlug = href.split('/').filter(Boolean).pop() || '';
            
            let type = 'tag';
            if (href.includes('/pornstars/')) type = 'model';
            else if (href.includes('/channels/')) type = 'channel';

            return [name, tagSlug, type];
          });

          const allTags = await sql`
            INSERT INTO tags (name, slug, type)
            VALUES ${sql(galleryTags)}
            ON CONFLICT (slug) DO UPDATE SET type = EXCLUDED.type
            RETURNING id, name, slug, type
          `;
          
          if (allTags && allTags.length > 0) {
            finalTags = allTags;
            const linkages = allTags.map((t: any) => [galleryId, t.id]);
            await sql`
              INSERT INTO gallery_tags (gallery_id, tag_id)
              VALUES ${sql(linkages)}
              ON CONFLICT (gallery_id, tag_id) DO NOTHING
            `;
          }
        }

        return {
          images: data.link_list.map((url: string, i: number) => ({ gallery_id: galleryId, url, id: `temp-${i}` })),
          tags: finalTags,
          metadata: updatedMeta
        };
      }
    } catch (err) {
      console.error(`Ingestion Exception (Gallery ${slug}):`, err);
    }
    return null;
  }

};
