import { getCollection } from "astro:content";

export {
  getBacklinks,
  getNoteSlug,
  getNoteUrl,
  getTagIndex,
  toTagSlug,
  validateTagNames,
} from "./note-graph.mjs";

export async function getNotes() {
  const notes = await getCollection("notes");
  return notes.sort((a, b) => b.data.updated.valueOf() - a.data.updated.valueOf());
}

export function formatNoteDate(date: Date, lang: "en" | "zh-TW" = "en") {
  return new Intl.DateTimeFormat(lang, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}
