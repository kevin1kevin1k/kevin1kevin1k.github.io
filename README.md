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
npm run check
npm run build
npm run verify
```

`npm run verify` checks the generated `dist/` output for the core pages, migrated post URLs, legacy redirects, and static assets.

## Content

- Blog posts live in `src/content/blog/`.
- Static pages live in `src/content/pages/`.
- Public assets live in `public/` and are served from the site root.

## CV

- CV source lives in `cv/`.
- `npm run build:cv` compiles `cv/CV.tex` with XeLaTeX and updates `public/assets/pdf/cv.pdf`.
