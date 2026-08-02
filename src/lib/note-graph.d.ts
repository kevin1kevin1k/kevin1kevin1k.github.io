export interface NoteLike {
  id: string;
  body: string;
  data: {
    title: string;
    tags: string[];
  };
}

export interface TagGroup<T extends NoteLike> {
  name: string;
  notes: T[];
  slug: string;
}

export function getNoteSlug(id: string): string;
export function getNoteUrl(id: string): string;
export function toTagSlug(tag: string): string;
export function validateTagNames(tags: string[]): Map<string, string>;
export function getTagIndex<T extends NoteLike>(notes: T[]): Map<string, TagGroup<T>>;
export function getBacklinks<T extends NoteLike>(notes: T[], targetSlug: string): T[];
