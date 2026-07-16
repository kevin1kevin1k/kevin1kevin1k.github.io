# CV Source

This directory contains the XeLaTeX source for the published CV at `/assets/pdf/cv.pdf`.

## Build

From the repository root:

```sh
npm run build:cv
```

The build compiles `CV.tex`, copies the generated PDF to `public/assets/pdf/cv.pdf`, and removes local LaTeX build artifacts from this directory.

## Template And Fonts

The CV is based on `simple-resume-cv`, released into the public domain. The local font files are kept in `Fonts/` so CI can compile the document consistently.
