"use server"

import { ingestionService } from "@/lib/ingestion"

/**
 * Server Action to trigger tag hydration from a client component.
 */
export async function hydrateTagsAction() {
  try {
    await ingestionService.hydrateTags();
    return { success: true };
  } catch (error) {
    console.error("Server Action Error (Hydrate Tags):", error);
    return { success: false };
  }
}
