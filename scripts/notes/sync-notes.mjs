import { createHash } from "node:crypto";
import {
  access,
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import {
  basename,
  dirname,
  extname,
  isAbsolute,
  join,
  posix,
  relative,
  resolve,
} from "node:path";
import { fileURLToPath } from "node:url";

import GithubSlugger from "github-slugger";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkStringify from "remark-stringify";
import { unified } from "unified";
import { parse as parseYaml } from "yaml";

import { validateTagNames } from "../../src/lib/note-graph.mjs";

const imageExtensions = new Set([".avif", ".gif", ".jpeg", ".jpg", ".png", ".webp"]);
const parser = unified().use(remarkParse).use(remarkFrontmatter, ["yaml"]).use(remarkGfm);
const serializer = unified()
  .use(remarkStringify, { bullet: "-", fences: true })
  .use(remarkFrontmatter, ["yaml"])
  .use(remarkGfm);

function normalizeSource(source) {
  return posix.normalize(source.replaceAll("\\", "/"));
}

function isInside(root, path) {
  const pathFromRoot = relative(root, path);
  return pathFromRoot === "" || (!pathFromRoot.startsWith("..") && !isAbsolute(pathFromRoot));
}

async function resolveVaultFile(vaultRoot, source) {
  const path = await realpath(join(vaultRoot, source));
  if (!isInside(vaultRoot, path)) {
    throw new Error(`Source is outside the vault: ${source}`);
  }
  return path;
}

function validateManifest(manifest) {
  if (!manifest || manifest.version !== 1 || !Array.isArray(manifest.notes)) {
    throw new Error("public-notes.json must use version 1 and contain a notes array.");
  }

  const sources = new Set();
  const slugs = new Set();
  return manifest.notes.map((entry, index) => {
    if (!entry || typeof entry.source !== "string" || typeof entry.slug !== "string") {
      throw new Error(`Manifest entry ${index + 1} must contain source and slug strings.`);
    }
    const source = normalizeSource(entry.source);
    if (
      source.startsWith("../") ||
      source === ".." ||
      source.startsWith("/") ||
      !source.toLowerCase().endsWith(".md")
    ) {
      throw new Error(`Manifest source is outside the vault or is not Markdown: ${entry.source}`);
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*$/.test(entry.slug)) {
      throw new Error(`Invalid public note slug: ${entry.slug}`);
    }
    if (sources.has(source)) throw new Error(`Duplicate manifest source: ${source}`);
    if (slugs.has(entry.slug)) throw new Error(`Duplicate public note slug: ${entry.slug}`);
    sources.add(source);
    slugs.add(entry.slug);
    return { slug: entry.slug, source };
  });
}

function validateMetadata(tree, source) {
  const frontmatter = tree.children.find((node) => node.type === "yaml");
  if (!frontmatter) throw new Error(`${source} is missing YAML frontmatter.`);

  const data = parseYaml(frontmatter.value);
  if (!data || typeof data.title !== "string" || data.title.trim() === "") {
    throw new Error(`${source} has invalid title metadata.`);
  }
  const dateParts = typeof data.updated === "string"
    ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(data.updated)
    : null;
  const parsedDate = dateParts
    ? new Date(Date.UTC(Number(dateParts[1]), Number(dateParts[2]) - 1, Number(dateParts[3])))
    : null;
  if (
    !dateParts ||
    parsedDate.getUTCFullYear() !== Number(dateParts[1]) ||
    parsedDate.getUTCMonth() !== Number(dateParts[2]) - 1 ||
    parsedDate.getUTCDate() !== Number(dateParts[3])
  ) {
    throw new Error(`${source} has invalid updated metadata.`);
  }
  if (data.lang !== "en" && data.lang !== "zh-TW") {
    throw new Error(`${source} has invalid lang metadata.`);
  }
  if (data.description !== undefined && typeof data.description !== "string") {
    throw new Error(`${source} has invalid description metadata.`);
  }
  if (
    data.tags !== undefined &&
    (!Array.isArray(data.tags) ||
      data.tags.some((tag) => typeof tag !== "string" || tag.trim() === ""))
  ) {
    throw new Error(`${source} has invalid tags metadata.`);
  }
  return data;
}

function splitTarget(target) {
  const hashIndex = target.indexOf("#");
  if (hashIndex === -1) return { fragment: "", path: target };
  return {
    fragment: target.slice(hashIndex + 1),
    path: target.slice(0, hashIndex),
  };
}

function normalizeFragment(fragment) {
  if (!fragment) return "";
  return new GithubSlugger().slug(decodeURIComponent(fragment));
}

function nodeText(node) {
  if (typeof node.value === "string") return node.value;
  return (node.children ?? []).map(nodeText).join("");
}

function collectHeadingSlugs(tree) {
  const headings = new Set();
  const slugger = new GithubSlugger();

  function walk(node) {
    if (node.type === "heading") headings.add(slugger.slug(nodeText(node)));
    for (const child of node.children ?? []) walk(child);
  }
  walk(tree);
  return headings;
}

function collectReferenceKinds(tree) {
  const references = new Map();

  function add(identifier, kind) {
    const kinds = references.get(identifier) ?? new Set();
    kinds.add(kind);
    references.set(identifier, kinds);
  }

  function walk(node) {
    if (node.type === "linkReference") add(node.identifier, "link");
    if (node.type === "imageReference") add(node.identifier, "image");
    for (const child of node.children ?? []) walk(child);
  }
  walk(tree);
  return references;
}

function validateReferenceDefinitions(tree, source) {
  const identifiers = new Set();

  function walk(node) {
    if (node.type === "definition") {
      if (identifiers.has(node.identifier)) {
        throw new Error(`Duplicate reference definition: ${node.identifier} in ${source}`);
      }
      identifiers.add(node.identifier);
    }
    for (const child of node.children ?? []) walk(child);
  }

  walk(tree);
}

function assertFragmentExists(note, fragment) {
  const anchor = normalizeFragment(fragment);
  if (anchor && !note.headings.has(anchor)) {
    throw new Error(`Missing heading fragment #${anchor} in ${note.source}`);
  }
  return anchor;
}

function isExternalUrl(url) {
  return /^(?:[a-z][a-z\d+.-]*:|\/|#)/i.test(url);
}

function resolvePublicNote(target, currentNote, notesBySource) {
  const { fragment, path } = splitTarget(target);
  const withExtension = path.toLowerCase().endsWith(".md") ? path : `${path}.md`;
  const relativeSource = normalizeSource(posix.join(posix.dirname(currentNote.source), withExtension));
  const rootSource = normalizeSource(withExtension);
  let note = notesBySource.get(relativeSource) ?? notesBySource.get(rootSource);

  if (!note && !path.includes("/")) {
    const targetBasename = posix.basename(withExtension).toLowerCase();
    const matches = [...notesBySource.values()].filter(
      (candidate) => posix.basename(candidate.source).toLowerCase() === targetBasename,
    );
    if (matches.length === 1) note = matches[0];
    if (matches.length > 1) throw new Error(`Ambiguous wikilink: ${target}`);
  }

  if (!note) {
    throw new Error(`Linked note is not public: ${target} (from ${currentNote.source})`);
  }

  const anchor = normalizeFragment(fragment);
  return `/notes/${note.slug}/${anchor ? `#${anchor}` : ""}`;
}

function validateFinalFragments(tree, currentNote, notesBySlug) {
  function walk(node) {
    if (node.type === "link" || node.type === "definition") {
      const { fragment, path } = splitTarget(node.url);
      let targetNote;

      if (fragment && path === "") {
        targetNote = currentNote;
      } else if (fragment) {
        const noteRoute = /^\/notes\/(.+)\/$/.exec(path);
        if (noteRoute) {
          targetNote = notesBySlug.get(noteRoute[1]);
          if (!targetNote) {
            throw new Error(`Linked note is not public: ${path} (from ${currentNote.source})`);
          }
        }
      }

      if (targetNote) assertFragmentExists(targetNote, fragment);
    }

    for (const child of node.children ?? []) walk(child);
  }

  walk(tree);
}

async function publishImage(target, alt, currentNote, context) {
  const { path } = splitTarget(target);
  const source = normalizeSource(posix.join(posix.dirname(currentNote.source), path));
  const extension = extname(source).toLowerCase();
  if (!imageExtensions.has(extension)) {
    throw new Error(`Unsupported note attachment: ${target}`);
  }

  const sourcePath = await resolveVaultFile(context.vaultRoot, source);
  const contents = await readFile(sourcePath);
  const hash = createHash("sha256").update(contents).digest("hex").slice(0, 12);
  const filename = `${hash}-${basename(source).replace(/[^a-zA-Z0-9._-]/g, "-")}`;
  const destinationDirectory = join(
    context.outputRoot,
    "public/assets/notes",
    currentNote.slug,
  );
  await mkdir(destinationDirectory, { recursive: true });
  await writeFile(join(destinationDirectory, filename), contents);
  return {
    alt: alt || basename(source, extension),
    type: "image",
    url: `/assets/notes/${currentNote.slug}/${filename}`,
  };
}

async function pathExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function replacePublicSnapshot(stageRoot, repositoryRoot) {
  const replacements = [
    {
      backup: join(stageRoot, "backup/notes"),
      staged: join(stageRoot, "output/src/content/notes"),
      target: join(repositoryRoot, "src/content/notes"),
    },
    {
      backup: join(stageRoot, "backup/assets"),
      staged: join(stageRoot, "output/public/assets/notes"),
      target: join(repositoryRoot, "public/assets/notes"),
    },
  ];
  const activated = [];

  await mkdir(join(stageRoot, "backup"), { recursive: true });
  try {
    for (const replacement of replacements) {
      await mkdir(dirname(replacement.target), { recursive: true });
      const hadTarget = await pathExists(replacement.target);
      if (hadTarget) await rename(replacement.target, replacement.backup);
      try {
        await rename(replacement.staged, replacement.target);
        activated.push({ ...replacement, hadTarget });
      } catch (error) {
        if (hadTarget) await rename(replacement.backup, replacement.target);
        throw error;
      }
    }
  } catch (error) {
    for (const replacement of activated.reverse()) {
      await rm(replacement.target, { force: true, recursive: true });
      if (replacement.hadTarget) {
        await rename(replacement.backup, replacement.target);
      }
    }
    throw error;
  }
}

async function transformTextNode(node, currentNote, context) {
  const pattern = /(!?)\[\[([^\]]+)\]\]/g;
  const children = [];
  let cursor = 0;
  let match;

  while ((match = pattern.exec(node.value)) !== null) {
    if (match.index > cursor) {
      children.push({ type: "text", value: node.value.slice(cursor, match.index) });
    }
    const [target, label] = match[2].split("|", 2);
    if (match[1]) {
      children.push(await publishImage(target, label, currentNote, context));
    } else {
      children.push({
        children: [{ type: "text", value: label || splitTarget(target).path }],
        type: "link",
        url: resolvePublicNote(target, currentNote, context.notesBySource),
      });
    }
    cursor = pattern.lastIndex;
  }

  if (cursor === 0) return null;
  if (cursor < node.value.length) {
    children.push({ type: "text", value: node.value.slice(cursor) });
  }
  return children;
}

async function transformChildren(parent, currentNote, context) {
  if (!Array.isArray(parent.children)) return;

  for (let index = 0; index < parent.children.length; index += 1) {
    const child = parent.children[index];
    if (child.type === "text") {
      const replacement = await transformTextNode(child, currentNote, context);
      if (replacement) {
        parent.children.splice(index, 1, ...replacement);
        index += replacement.length - 1;
      }
      continue;
    }
    if (child.type === "definition") {
      const kinds = currentNote.references.get(child.identifier) ?? new Set();
      if (kinds.has("link") && kinds.has("image")) {
        throw new Error(
          `Reference ${child.identifier} cannot be both a note link and an image`,
        );
      }
      if (kinds.size === 0 && !isExternalUrl(child.url)) {
        throw new Error(`Unused relative definition: ${child.identifier}`);
      }
      if (child.url.startsWith("#") && child.url !== "#") {
        if (kinds.has("image")) {
          throw new Error(`Image reference ${child.identifier} cannot target a heading`);
        }
        child.url = `#${normalizeFragment(child.url.slice(1))}`;
        continue;
      }
      if (isExternalUrl(child.url)) continue;
      if (kinds.has("image") || imageExtensions.has(extname(splitTarget(child.url).path).toLowerCase())) {
        child.url = (await publishImage(child.url, "", currentNote, context)).url;
      } else {
        child.url = resolvePublicNote(child.url, currentNote, context.notesBySource);
      }
      continue;
    }
    if (child.type === "image" && !isExternalUrl(child.url)) {
      parent.children[index] = await publishImage(child.url, child.alt, currentNote, context);
      continue;
    }
    if (child.type === "link" && child.url.startsWith("#") && child.url !== "#") {
      const anchor = normalizeFragment(child.url.slice(1));
      child.url = `#${anchor}`;
      await transformChildren(child, currentNote, context);
      continue;
    }
    if (child.type === "link" && !isExternalUrl(child.url)) {
      child.url = resolvePublicNote(child.url, currentNote, context.notesBySource);
    }
    await transformChildren(child, currentNote, context);
  }
}

export async function syncNotes({ repositoryDir, vaultDir }) {
  const repositoryRoot = await realpath(resolve(repositoryDir));
  const vaultRoot = await realpath(resolve(vaultDir));
  if (isInside(repositoryRoot, vaultRoot)) {
    throw new Error("The notes vault must be outside the repository.");
  }

  const manifest = JSON.parse(
    await readFile(join(vaultRoot, "public-notes.json"), "utf8"),
  );
  const notes = validateManifest(manifest);
  const stageRoot = await mkdtemp(join(repositoryRoot, ".notes-sync-"));
  const outputRoot = join(stageRoot, "output");

  try {
    await mkdir(join(outputRoot, "src/content/notes"), { recursive: true });
    await mkdir(join(outputRoot, "public/assets/notes"), { recursive: true });
    const parsedNotes = [];
    for (const note of notes) {
      const sourcePath = await resolveVaultFile(vaultRoot, note.source);
      const source = await readFile(sourcePath, "utf8");
      const tree = parser.parse(source);
      validateReferenceDefinitions(tree, note.source);
      const metadata = validateMetadata(tree, note.source);
      parsedNotes.push({
        ...note,
        metadata,
        references: collectReferenceKinds(tree),
        tree,
      });
    }
    validateTagNames(parsedNotes.flatMap((note) => note.metadata.tags ?? []));

    const notesBySource = new Map(parsedNotes.map((note) => [note.source, note]));
    const context = { notesBySource, outputRoot, vaultRoot };
    for (const note of parsedNotes) {
      await transformChildren(note.tree, note, context);
    }
    for (const note of parsedNotes) {
      note.headings = collectHeadingSlugs(note.tree);
    }

    const notesBySlug = new Map(parsedNotes.map((note) => [note.slug, note]));
    for (const note of parsedNotes) {
      const { tree } = note;
      validateFinalFragments(tree, note, notesBySlug);
      const destination = join(outputRoot, "src/content/notes", `${note.slug}.md`);
      await mkdir(dirname(destination), { recursive: true });
      await writeFile(destination, serializer.stringify(tree));
    }
    await replacePublicSnapshot(stageRoot, repositoryRoot);
  } finally {
    await rm(stageRoot, { force: true, recursive: true });
  }
}

export function parseArguments(argumentsList) {
  let vaultDir;
  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index];
    if (argument !== "--vault" || !argumentsList[index + 1]) {
      throw new Error("Usage: npm run notes:sync -- --vault /absolute/path/to/vault");
    }
    vaultDir = argumentsList[index + 1];
    index += 1;
  }
  if (!vaultDir) {
    throw new Error("The --vault argument is required.");
  }
  if (!isAbsolute(vaultDir)) {
    throw new Error("The --vault path must be absolute.");
  }
  return { vaultDir };
}

async function runCli() {
  const { vaultDir } = parseArguments(process.argv.slice(2));
  await syncNotes({ repositoryDir: process.cwd(), vaultDir });
  console.log("Public notes synchronized.");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  runCli().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
