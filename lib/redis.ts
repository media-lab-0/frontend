/* eslint-disable @typescript-eslint/no-explicit-any */
import { Redis } from '@upstash/redis'

if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
  throw new Error('Missing Upstash Redis environment variables')
}

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

// Helper to get/set category cache
export const categoryCache = {
  async set(slug: string, data: { name: string; image_url: string }) {
    await redis.set(`homecat:${slug}`, JSON.stringify(data), { ex: 60 * 60 * 24 * 30 }) // Cache for 7 days
  },
  
  async get(slug: string) {
    const data = await redis.get(`homecat:${slug}`)
    if (typeof data === 'string') {
      return JSON.parse(data)
    }
    return data
  },

  async setAll(categories: { slug: string; name: string; image_url: string }[]) {
     const pipeline = redis.pipeline();
     categories.forEach(cat => {
       pipeline.set(`homecat:${cat.slug}`, JSON.stringify(cat), { ex: 60 * 60 * 24 * 7 });
     });
     await pipeline.exec();
  }
}

// Helper to get/set gallery search results per tag
export const tagGalleriesCache = {
  async set(slug: string, posts: any[]) {
    // Cache search results for 1 hour to balance freshness and quota
    await redis.set(`tag-search:${slug}`, JSON.stringify(posts), { ex: 60 * 60 }) 
  },
  
  async get(slug: string) {
    const data = await redis.get(`tag-search:${slug}`)
    if (typeof data === 'string') {
      return JSON.parse(data)
    }
    return data
  }
}

// Helper to get/set gallery filter results
export const filteredGalleriesCache = {
  async set(cacheKey: string, posts: any[]) {
    // Cache filter results for 1 hour
    await redis.set(`filter-${cacheKey}`, JSON.stringify(posts), { ex: 60 * 60 }) 
  },
  
  async get(cacheKey: string) {
    const data = await redis.get(`filter-${cacheKey}`)
    if (typeof data === 'string') {
      return JSON.parse(data)
    }
    return data
  }
}
