import assert from "node:assert/strict";
import test from "node:test";

import {
  getBacklinks,
  getNoteSlug,
  getNoteUrl,
  getTagIndex,
  toTagSlug,
} from "../src/lib/note-graph.mjs";

function note(id, title, body, tags = []) {
  return {
    body,
    data: { tags, title, updated: new Date("2026-08-02") },
    id,
  };
}

test("builds stable nested note and Unicode tag URLs", () => {
  assert.equal(getNoteSlug("llm/evaluation.md"), "llm/evaluation");
  assert.equal(getNoteUrl("llm/evaluation.md"), "/notes/llm/evaluation/");
  assert.equal(toTagSlug("Machine Learning"), "machine-learning");
  assert.equal(toTagSlug("機器 學習"), "機器-學習");
});

test("rejects distinct tags that normalize to the same route", () => {
  assert.throws(
    () => getTagIndex([note("one.md", "One", "", ["C++", "C#"])]),
    /Tag slug collision.*C\+\+.*C#/,
  );
  assert.throws(
    () => getTagIndex([note("empty.md", "Empty", "", [""])]),
    /Tag cannot produce a route/,
  );
});

test("builds backlinks from note links but ignores code examples", () => {
  const notes = [
    note(
      "source.md",
      "Source",
      `[Target](/notes/target/#details)

\`[Not a link](/notes/other/)\`

\`\`\`md
[Also not a link](/notes/other/)
\`\`\`
`,
    ),
    note("target.md", "Target", "No outgoing links."),
    note("other.md", "Other", "No outgoing links."),
  ];

  assert.deepEqual(
    getBacklinks(notes, "target").map((entry) => entry.data.title),
    ["Source"],
  );
  assert.deepEqual(getBacklinks(notes, "other"), []);
});

test("builds backlinks only from used reference-style note links", () => {
  const notes = [
    note(
      "source.md",
      "Source",
      `[Target][target]

![Image][image]

[target]: /notes/target/#details
[image]: /notes/other/
[unused]: /notes/other/
`,
    ),
    note("target.md", "Target", "No outgoing links."),
    note("other.md", "Other", "No outgoing links."),
  ];

  assert.deepEqual(
    getBacklinks(notes, "target").map((entry) => entry.data.title),
    ["Source"],
  );
  assert.deepEqual(getBacklinks(notes, "other"), []);
});
