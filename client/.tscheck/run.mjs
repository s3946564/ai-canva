// Sandbox-safe harness: mirrors gamedoc.test.ts using node:assert, so the pure
// logic can be verified without vitest/esbuild (which cannot spawn under the
// DSH sandbox). Deleted after the check — the real test file is gamedoc.test.ts.
import assert from "node:assert/strict";
import {
  GAMEDOC_SECTIONS,
  annotateDesignDoc,
  checkDesignDocSections,
} from "./gamedoc.mjs";

const COMPLETE = `## Concept
A two-player co-op game about a lighthouse.

## Core Loop
Spot a ship, light the beam, refuel, repeat every 90 seconds.

## Mechanics
Two verbs: aim the beam, carry oil.

## Progression
Five nights, each with more traffic.

## Art & Audio Direction
Flat vector shapes, fog, a single foghorn sample.

## Scope & Risks
Risky: the ship AI. Likely to be cut: weather.

## MVP
One night, one ship type, no audio.
`;

let passed = 0;
function check(name, fn) {
  fn();
  passed++;
  console.log("PASS  " + name);
}

check("accepts a document with every required section", () => {
  const c = checkDesignDocSections(COMPLETE);
  assert.equal(c.ok, true);
  assert.deepEqual(c.missing, []);
  assert.deepEqual(c.present, [...GAMEDOC_SECTIONS]);
});

check("names the sections the model skipped", () => {
  const partial = COMPLETE.replace(/## Scope & Risks[\s\S]*?(?=## MVP)/, "");
  const c = checkDesignDocSections(partial);
  assert.equal(c.ok, false);
  assert.deepEqual(c.missing, ["Scope & Risks"]);
  assert.ok(c.present.includes("MVP"));
});

check("treats an empty reply as entirely missing", () => {
  const c = checkDesignDocSections("");
  assert.equal(c.ok, false);
  assert.deepEqual(c.missing, [...GAMEDOC_SECTIONS]);
});

check("accepts 'and' where the prompt wrote '&'", () => {
  const doc = COMPLETE.replace(
    "## Art & Audio Direction",
    "## Art and Audio Direction"
  );
  assert.equal(checkDesignDocSections(doc).ok, true);
});

check("accepts a heading with extra words or another heading level", () => {
  const doc = COMPLETE.replace("## Core Loop", "### Core Loop (about 30 seconds)");
  assert.equal(checkDesignDocSections(doc).ok, true);
});

check("falls back to full-line bold headings", () => {
  const doc = COMPLETE.replace(/^## /gm, "").replace(/^(.+)$/gm, "**$1**");
  assert.equal(checkDesignDocSections(doc).ok, true);
});

check("does not count a section mentioned only in prose", () => {
  const doc = COMPLETE.replace("## MVP\n", "An MVP could follow later.\n");
  assert.deepEqual(checkDesignDocSections(doc).missing, ["MVP"]);
});

check("returns a complete document unchanged", () => {
  assert.equal(annotateDesignDoc(COMPLETE, checkDesignDocSections(COMPLETE)), COMPLETE);
});

check("annotates an incomplete document with the missing sections", () => {
  const doc = "## Concept\nA game.\n";
  const out = annotateDesignDoc(doc, checkDesignDocSections(doc));
  assert.ok(out.includes("Incomplete design document"));
  assert.ok(out.includes("Core Loop"));
  assert.ok(out.includes("MVP"));
  assert.ok(out.startsWith("## Concept"));
});

console.log(`\nALL ${passed} CHECKS PASSED`);
