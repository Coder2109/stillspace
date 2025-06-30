import type { CollectionEntry } from "astro:content";
import { siteConfig } from "@/site.config";

export function collectionTitleSort(
	a: CollectionEntry<"post" | "note">,
	b: CollectionEntry<"post" | "note">,
) {
	return a.data.title.localeCompare(b.data.title, siteConfig.lang)
}
