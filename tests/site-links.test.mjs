import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";

import { findBrokenInternalLinks } from "../scripts/lib/verify-links.mjs";

async function createSite(files) {
  const dist = await mkdtemp(join(tmpdir(), "site-links-"));
  for (const [relativePath, contents] of Object.entries(files)) {
    const path = join(dist, relativePath);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, contents);
  }
  return dist;
}

test("accepts existing pages, assets, and heading fragments", async () => {
  const dist = await createSite({
    "assets/image.png": "PNG",
    "index.html": `<a href="/notes/target/#details">Target</a>
      <img src="/assets/image.png" alt="Image">`,
    "notes/target/index.html": `<h1>Target</h1><h2 id="details">Details</h2>`,
  });

  assert.deepEqual(await findBrokenInternalLinks(dist), []);
});

test("reports missing internal pages and fragments", async () => {
  const dist = await createSite({
    "index.html": `<a href="/missing/">Missing</a>
      <a href="/notes/target/#missing-heading">Missing heading</a>`,
    "notes/target/index.html": `<h1>Target</h1>`,
  });

  assert.deepEqual(await findBrokenInternalLinks(dist), [
    {
      href: "/missing/",
      reason: "missing target",
      source: "index.html",
    },
    {
      href: "/notes/target/#missing-heading",
      reason: "missing fragment #missing-heading",
      source: "index.html",
    },
  ]);
});

test("ignores external, protocol, and same-page empty links", async () => {
  const dist = await createSite({
    "index.html": `<a href="https://example.com">External</a>
      <a href="mailto:test@example.com">Email</a>
      <a href="#">Top</a>`,
  });

  assert.deepEqual(await findBrokenInternalLinks(dist), []);
});
