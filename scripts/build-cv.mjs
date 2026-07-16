import { copyFileSync, existsSync, mkdirSync, statSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const cvDir = join(root, "cv");
const sourcePdf = join(cvDir, "CV.pdf");
const targetPdf = join(root, "public", "assets", "pdf", "cv.pdf");

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { stdio: "inherit", ...options });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run("latexmk", ["-xelatex", "-interaction=nonstopmode", "-halt-on-error", "CV.tex"], {
  cwd: cvDir,
});

if (!existsSync(sourcePdf) || statSync(sourcePdf).size === 0) {
  throw new Error("Expected cv/CV.pdf to be generated and non-empty.");
}

mkdirSync(join(root, "public", "assets", "pdf"), { recursive: true });
copyFileSync(sourcePdf, targetPdf);

for (const extension of [
  "aux",
  "fdb_latexmk",
  "fls",
  "log",
  "out",
  "pdf",
  "xdv",
]) {
  const path = join(cvDir, `CV.${extension}`);
  if (existsSync(path)) {
    unlinkSync(path);
  }
}

console.log(`Built ${targetPdf}`);
