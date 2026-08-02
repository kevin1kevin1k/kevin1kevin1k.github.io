import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const dist = join(process.cwd(), "dist");

const checks = [
  ["index.html", ["Yu-Sheng Li", "Tools for literature survey"]],
  ["about/index.html", ["About", "/assets/pdf/cv.pdf"]],
  ["publications/index.html", ["Publications", "KDD 2021", "ICML 2020"]],
  ["blog/index.html", ["Blog", "My first blog post!"]],
  ["blog/first-post/index.html", ["My first blog post!", "Hope I will continue writing more posts."]],
  [
    "blog/literature-survey-tool/index.html",
    ["Tools for literature survey", "/assets/images/literature-survey-tool/semantic-1.png"],
  ],
  ["notes/index.html", ["Notes", "Public knowledge base", "發布公開筆記"]],
  [
    "notes/public-knowledge-base/index.html",
    ["Public knowledge base", "Backlinks", "發布公開筆記"],
  ],
  [
    "notes/publishing-public-notes/index.html",
    ["發布公開筆記", "Backlinks", "Public knowledge base"],
  ],
  ["notes/tags/workflow/index.html", ["workflow", "Public knowledge base", "發布公開筆記"]],
  ["404.html", ["404"]],
  ["first-post/index.html", ["url=/blog/first-post/"]],
  ["literature-survey-tool/index.html", ["url=/blog/literature-survey-tool/"]],
];

const assets = [
  "assets/pdf/cv.pdf",
  "assets/images/literature-survey-tool/semantic-1.png",
  "images/404.jpg",
];

function assertFile(path) {
  const fullPath = join(dist, path);
  if (!existsSync(fullPath)) {
    throw new Error(`Missing ${path}`);
  }
  return fullPath;
}

for (const [path, expectedTexts] of checks) {
  const html = readFileSync(assertFile(path), "utf8");
  for (const text of expectedTexts) {
    if (!html.includes(text)) {
      throw new Error(`${path} does not include ${JSON.stringify(text)}`);
    }
  }
}

for (const asset of assets) {
  const fullPath = assertFile(asset);
  if (statSync(fullPath).size === 0) {
    throw new Error(`${asset} is empty`);
  }
}

console.log("Site verification passed.");
