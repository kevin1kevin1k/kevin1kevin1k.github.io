import { readFile, readdir, stat } from "node:fs/promises";
import { extname, join, relative, resolve, sep } from "node:path";

import { parse } from "parse5";

async function listHtmlFiles(directory, root = directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await listHtmlFiles(path, root)));
    if (entry.isFile() && entry.name.endsWith(".html")) {
      files.push(relative(root, path).split(sep).join("/"));
    }
  }
  return files.sort();
}

function getAttribute(node, name) {
  return node.attrs?.find((attribute) => attribute.name === name)?.value;
}

function collectReferences(node, references = []) {
  const attribute = node.tagName === "a" || node.tagName === "link" ? "href" : "src";
  if (["a", "img", "link", "script", "source"].includes(node.tagName)) {
    const value = getAttribute(node, attribute);
    if (value) references.push(value);
  }
  for (const child of node.childNodes ?? []) collectReferences(child, references);
  return references;
}

function collectFragments(node, fragments = new Set()) {
  const id = getAttribute(node, "id");
  const name = node.tagName === "a" ? getAttribute(node, "name") : undefined;
  if (id) fragments.add(id);
  if (name) fragments.add(name);
  for (const child of node.childNodes ?? []) collectFragments(child, fragments);
  return fragments;
}

function sourceUrl(relativePath) {
  if (relativePath === "index.html") return "/";
  if (relativePath.endsWith("/index.html")) {
    return `/${relativePath.slice(0, -"index.html".length)}`;
  }
  return `/${relativePath}`;
}

async function isFile(path) {
  try {
    return (await stat(path)).isFile();
  } catch {
    return false;
  }
}

async function resolveTarget(dist, pathname) {
  let decodedPath;
  try {
    decodedPath = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  const relativePath = decodedPath.replace(/^\/+/, "");
  const candidates = [];
  if (decodedPath.endsWith("/")) {
    candidates.push(join(dist, relativePath, "index.html"));
  } else {
    candidates.push(join(dist, relativePath));
    if (!extname(relativePath)) {
      candidates.push(join(dist, relativePath, "index.html"));
      candidates.push(join(dist, `${relativePath}.html`));
    }
  }

  for (const candidate of candidates) {
    const resolved = resolve(candidate);
    if ((resolved === dist || resolved.startsWith(`${dist}${sep}`)) && (await isFile(resolved))) {
      return resolved;
    }
  }
  return null;
}

export async function findBrokenInternalLinks(distDirectory) {
  const dist = resolve(distDirectory);
  const issues = [];
  const documents = new Map();

  for (const source of await listHtmlFiles(dist)) {
    const sourcePath = join(dist, source);
    const document = parse(await readFile(sourcePath, "utf8"));
    documents.set(sourcePath, document);

    for (const href of collectReferences(document)) {
      if (href === "#") continue;
      let targetUrl;
      try {
        targetUrl = new URL(href, `https://site.test${sourceUrl(source)}`);
      } catch {
        continue;
      }
      if (targetUrl.origin !== "https://site.test") continue;

      const targetPath = await resolveTarget(dist, targetUrl.pathname);
      if (!targetPath) {
        issues.push({ href, reason: "missing target", source });
        continue;
      }
      if (!targetUrl.hash || targetUrl.hash === "#" || !targetPath.endsWith(".html")) continue;

      const targetDocument =
        documents.get(targetPath) ?? parse(await readFile(targetPath, "utf8"));
      documents.set(targetPath, targetDocument);
      const fragment = decodeURIComponent(targetUrl.hash.slice(1));
      if (!collectFragments(targetDocument).has(fragment)) {
        issues.push({
          href,
          reason: `missing fragment #${fragment}`,
          source,
        });
      }
    }
  }
  return issues;
}
