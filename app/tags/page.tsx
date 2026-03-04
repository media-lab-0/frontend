import { sql } from "@/lib/db"
import { ingestionService } from "@/lib/ingestion"
import TagsClient from "./TagsClient"

export default async function TagsDirectoryPage() {
  let tags = await sql`SELECT name, slug FROM tags ORDER BY name`;
  
  if (!tags || tags.length === 0) {
    // Trigger JIT hydration
    await ingestionService.hydrateTags();
    tags = await sql`SELECT name, slug FROM tags ORDER BY name`;
  }

  return <TagsClient initialTags={tags as any[]} />;
}
