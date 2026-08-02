# Yu-Sheng Li

Personal site built with [Astro](https://astro.build/) and deployed to GitHub Pages.

## Development

```sh
npm install
npm run dev
```

## Checks

```sh
npm run build:cv
npm test
npm run check
npm run build
npm run verify
```

`npm run build` generates the Astro site and its static Pagefind search index. `npm run verify` checks the generated `dist/` output for core pages, migrated post URLs, legacy redirects, static assets, Pagefind files, and broken internal links or fragments.

## Content

- Blog posts live in `src/content/blog/`.
- Public knowledge-base notes live in `src/content/notes/`.
- Static pages live in `src/content/pages/`.
- Public assets live in `public/` and are served from the site root.

## Public notes

The private notes vault must remain outside this repository. A `public-notes.json` file in that vault is the explicit publication allowlist and is never copied into the site.

```json
{
  "version": 1,
  "notes": [
    {
      "source": "LLM/Evaluation.md",
      "slug": "llm/evaluation"
    }
  ]
}
```

Each selected Markdown file uses this frontmatter:

```yaml
---
title: Evaluation
description: Notes on evaluating language models.
updated: 2026-08-02
lang: en
tags:
  - llm
  - evaluation
---
```

`title`, `updated`, and `lang` are required. `lang` accepts `en` or `zh-TW`; `description` is optional and `tags` defaults to an empty list.

Synchronize the complete public snapshot with an absolute vault path:

```sh
npm run notes:sync -- --vault /absolute/path/to/notes-vault
```

The command replaces `src/content/notes/` and `public/assets/notes/` only after every selected note validates. Review the resulting Git diff before committing it. A failed synchronization restores the previous public snapshot.

Public notes may link with relative Markdown links or wikilinks:

```md
[Evaluation](../LLM/Evaluation.md#Metrics)
[[LLM/Evaluation#Metrics|Evaluation metrics]]
```

Relative Markdown images and `![[image.png]]` embeds are copied only when referenced. Supported image formats are PNG, JPEG, GIF, WebP, and AVIF. Links to private notes, missing files, ambiguous wikilinks, unsupported attachments, and paths outside the vault stop the synchronization.

For a local search preview, build before starting the preview server:

```sh
npm run build
npm run preview
```

## CV

- CV source lives in `cv/`.
- `npm run build:cv` compiles `cv/CV.tex` with XeLaTeX and updates `public/assets/pdf/cv.pdf`.
