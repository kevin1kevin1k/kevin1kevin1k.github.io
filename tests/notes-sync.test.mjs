import assert from "node:assert/strict";
import {
  access,
  mkdtemp,
  mkdir,
  readFile,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { parseArguments, syncNotes } from "../scripts/notes/sync-notes.mjs";

async function createFixture() {
  const root = await mkdtemp(join(tmpdir(), "public-notes-"));
  const vaultDir = join(root, "vault");
  const repositoryDir = join(root, "repository");
  await mkdir(vaultDir, { recursive: true });
  await mkdir(repositoryDir, { recursive: true });
  return { repositoryDir, vaultDir };
}

async function writeNote(vaultDir, relativePath, body) {
  const path = join(vaultDir, relativePath);
  await mkdir(join(path, ".."), { recursive: true });
  await writeFile(path, body);
}

test("exports only notes selected by the public manifest", async () => {
  const { repositoryDir, vaultDir } = await createFixture();
  await writeFile(
    join(vaultDir, "public-notes.json"),
    JSON.stringify({
      version: 1,
      notes: [{ source: "Public.md", slug: "public" }],
    }),
  );
  await writeNote(
    vaultDir,
    "Public.md",
    `---
title: Public note
updated: 2026-08-02
lang: en
tags: [public]
---

This text is safe to publish.
`,
  );
  await writeNote(vaultDir, "Private.md", "PRIVATE_SENTINEL");

  await syncNotes({ repositoryDir, vaultDir });

  const exported = await readFile(
    join(repositoryDir, "src/content/notes/public.md"),
    "utf8",
  );
  assert.match(exported, /This text is safe to publish/);
  assert.doesNotMatch(exported, /PRIVATE_SENTINEL/);
});

test("rewrites public note links and copies only referenced images", async () => {
  const { repositoryDir, vaultDir } = await createFixture();
  await writeFile(
    join(vaultDir, "public-notes.json"),
    JSON.stringify({
      version: 1,
      notes: [
        { source: "First.md", slug: "first" },
        { source: "folder/Second.md", slug: "guides/second" },
      ],
    }),
  );
  await writeNote(
    vaultDir,
    "First.md",
    `---
title: First note
updated: 2026-08-02
lang: en
tags: [public]
---

[Markdown link](folder/Second.md#Details)

[[folder/Second#Details|Wiki link]]

![Diagram](assets/diagram.png)

![[assets/diagram.png]]
`,
  );
  await writeNote(
    vaultDir,
    "folder/Second.md",
    `---
title: Second note
updated: 2026-08-01
lang: en
tags: [public]
---

## Details
`,
  );
  await mkdir(join(vaultDir, "assets"));
  await writeFile(join(vaultDir, "assets/diagram.png"), "PNG_CONTENT");
  await writeFile(join(vaultDir, "assets/private.png"), "PRIVATE_IMAGE");

  await syncNotes({ repositoryDir, vaultDir });

  const exported = await readFile(
    join(repositoryDir, "src/content/notes/first.md"),
    "utf8",
  );
  assert.match(exported, /\[Markdown link\]\(\/notes\/guides\/second\/#details\)/);
  assert.match(exported, /\[Wiki link\]\(\/notes\/guides\/second\/#details\)/);
  assert.match(
    exported,
    /!\[Diagram\]\(\/assets\/notes\/first\/[a-f0-9]{12}-diagram\.png\)/,
  );
  assert.match(
    exported,
    /!\[diagram\]\(\/assets\/notes\/first\/[a-f0-9]{12}-diagram\.png\)/,
  );

  const assetMatch = exported.match(
    /\/assets\/notes\/first\/([a-f0-9]{12}-diagram\.png)/,
  );
  assert.ok(assetMatch);
  assert.equal(
    await readFile(
      join(repositoryDir, "public/assets/notes/first", assetMatch[1]),
      "utf8",
    ),
    "PNG_CONTENT",
  );
  await assert.rejects(
    access(join(repositoryDir, "public/assets/notes/first/private.png")),
  );
});

test("rejects notes with invalid public metadata", async () => {
  const { repositoryDir, vaultDir } = await createFixture();
  await writeFile(
    join(vaultDir, "public-notes.json"),
    JSON.stringify({
      version: 1,
      notes: [{ source: "Invalid.md", slug: "invalid" }],
    }),
  );
  await writeNote(
    vaultDir,
    "Invalid.md",
    `---
title: Invalid note
updated: someday
lang: fr
---

Invalid metadata must not be published.
`,
  );

  await assert.rejects(
    syncNotes({ repositoryDir, vaultDir }),
    /Invalid\.md.*updated|Invalid\.md.*lang/,
  );
});

test("rejects manifest sources outside the vault", async () => {
  const { repositoryDir, vaultDir } = await createFixture();
  await writeFile(
    join(vaultDir, "public-notes.json"),
    JSON.stringify({
      version: 1,
      notes: [{ source: "../Secret.md", slug: "secret" }],
    }),
  );
  await writeNote(
    join(vaultDir, ".."),
    "Secret.md",
    `---
title: Secret
updated: 2026-08-02
lang: en
---

PRIVATE_SENTINEL
`,
  );

  await assert.rejects(
    syncNotes({ repositoryDir, vaultDir }),
    /outside the vault/,
  );
});

test("keeps the previous public snapshot when a later note fails", async () => {
  const { repositoryDir, vaultDir } = await createFixture();
  const existingNotes = join(repositoryDir, "src/content/notes");
  const existingAssets = join(repositoryDir, "public/assets/notes/old");
  await mkdir(existingNotes, { recursive: true });
  await mkdir(existingAssets, { recursive: true });
  await writeFile(join(existingNotes, "old.md"), "PREVIOUS_NOTE");
  await writeFile(join(existingAssets, "old.png"), "PREVIOUS_IMAGE");
  await writeFile(
    join(vaultDir, "public-notes.json"),
    JSON.stringify({
      version: 1,
      notes: [
        { source: "First.md", slug: "first" },
        { source: "Broken.md", slug: "broken" },
      ],
    }),
  );
  await writeNote(
    vaultDir,
    "First.md",
    `---
title: First
updated: 2026-08-02
lang: en
---

This would be published first.
`,
  );
  await writeNote(
    vaultDir,
    "Broken.md",
    `---
title: Broken
updated: 2026-08-02
lang: en
---

[[Private]]
`,
  );

  await assert.rejects(
    syncNotes({ repositoryDir, vaultDir }),
    /Linked note is not public/,
  );
  assert.equal(await readFile(join(existingNotes, "old.md"), "utf8"), "PREVIOUS_NOTE");
  assert.equal(
    await readFile(join(existingAssets, "old.png"), "utf8"),
    "PREVIOUS_IMAGE",
  );
  await assert.rejects(access(join(existingNotes, "first.md")));
});

test("rejects duplicate public slugs", async () => {
  const { repositoryDir, vaultDir } = await createFixture();
  await writeFile(
    join(vaultDir, "public-notes.json"),
    JSON.stringify({
      version: 1,
      notes: [
        { source: "First.md", slug: "duplicate" },
        { source: "Second.md", slug: "duplicate" },
      ],
    }),
  );

  await assert.rejects(
    syncNotes({ repositoryDir, vaultDir }),
    /Duplicate public note slug: duplicate/,
  );
});

test("reports an ambiguous filename-only wikilink", async () => {
  const { repositoryDir, vaultDir } = await createFixture();
  await writeFile(
    join(vaultDir, "public-notes.json"),
    JSON.stringify({
      version: 1,
      notes: [
        { source: "Index.md", slug: "index" },
        { source: "a/Shared.md", slug: "a/shared" },
        { source: "b/Shared.md", slug: "b/shared" },
      ],
    }),
  );
  await writeNote(
    vaultDir,
    "Index.md",
    `---
title: Index
updated: 2026-08-02
lang: en
---

[[Shared]]
`,
  );
  for (const folder of ["a", "b"]) {
    await writeNote(
      vaultDir,
      `${folder}/Shared.md`,
      `---
title: Shared
updated: 2026-08-02
lang: en
---
`,
    );
  }

  await assert.rejects(
    syncNotes({ repositoryDir, vaultDir }),
    /Ambiguous wikilink: Shared/,
  );
});

test("rejects image symlinks that leave the vault", async () => {
  const { repositoryDir, vaultDir } = await createFixture();
  const outsideImage = join(vaultDir, "..", "outside.png");
  await writeFile(outsideImage, "PRIVATE_IMAGE");
  await mkdir(join(vaultDir, "assets"));
  const { symlink } = await import("node:fs/promises");
  await symlink(outsideImage, join(vaultDir, "assets/outside.png"));
  await writeFile(
    join(vaultDir, "public-notes.json"),
    JSON.stringify({
      version: 1,
      notes: [{ source: "Public.md", slug: "public" }],
    }),
  );
  await writeNote(
    vaultDir,
    "Public.md",
    `---
title: Public
updated: 2026-08-02
lang: en
---

![Outside](assets/outside.png)
`,
  );

  await assert.rejects(
    syncNotes({ repositoryDir, vaultDir }),
    /outside the vault/,
  );
});

test("requires an absolute vault path from the CLI", () => {
  assert.deepEqual(parseArguments(["--vault", "/tmp/notes-vault"]), {
    vaultDir: "/tmp/notes-vault",
  });
  assert.throws(() => parseArguments([]), /--vault/);
  assert.throws(() => parseArguments(["--vault", "relative/vault"]), /absolute/);
});
