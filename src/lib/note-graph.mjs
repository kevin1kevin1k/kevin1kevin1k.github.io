import GithubSlugger from "github-slugger";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { visit } from "unist-util-visit";

const markdownParser = unified().use(remarkParse);

export function getNoteSlug(id) {
  return id.replace(/\.mdx?$/, "");
}

export function getNoteUrl(id) {
  return `/notes/${getNoteSlug(id)}/`;
}

export function toTagSlug(tag) {
  return new GithubSlugger().slug(tag.normalize("NFKC").trim());
}

function registerTag(tagsBySlug, tag) {
  const slug = toTagSlug(tag);
  if (!slug) throw new Error(`Tag cannot produce a route: ${tag}`);
  const existing = tagsBySlug.get(slug);
  if (existing && existing !== tag) {
    throw new Error(`Tag slug collision: ${existing} and ${tag}`);
  }
  tagsBySlug.set(slug, tag);
  return slug;
}

export function validateTagNames(tags) {
  const tagsBySlug = new Map();
  for (const tag of tags) registerTag(tagsBySlug, tag);
  return tagsBySlug;
}

export function getTagIndex(notes) {
  validateTagNames(notes.flatMap((note) => note.data.tags));
  const tagsBySlug = new Map();
  for (const note of notes) {
    for (const tag of note.data.tags) {
      const slug = toTagSlug(tag);
      const existing = tagsBySlug.get(slug);
      if (existing && existing.name !== tag) {
        throw new Error(`Tag slug collision: ${existing.name} and ${tag}`);
      }
      if (existing) {
        if (!existing.notes.includes(note)) existing.notes.push(note);
      } else {
        tagsBySlug.set(slug, { name: tag, notes: [note], slug });
      }
    }
  }
  return tagsBySlug;
}

function getOutgoingNoteSlugs(markdown) {
  const links = new Set();
  const linkReferences = new Set();
  const tree = markdownParser.parse(markdown);

  function registerUrl(url) {
    const match = url.match(/^\/notes\/(.+?)\/?(?:#.*)?$/);
    if (match) links.add(decodeURIComponent(match[1]));
  }

  visit(tree, "link", (node) => registerUrl(node.url));
  visit(tree, "linkReference", (node) => linkReferences.add(node.identifier));
  visit(tree, "definition", (node) => {
    if (linkReferences.has(node.identifier)) registerUrl(node.url);
  });
  return links;
}

export function getBacklinks(notes, targetSlug) {
  return notes
    .filter((note) => getOutgoingNoteSlugs(note.body).has(targetSlug))
    .sort((a, b) => a.data.title.localeCompare(b.data.title));
}
