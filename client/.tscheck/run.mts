// Sandbox-safe harness: mirrors gamedoc.test.ts using node:assert, importing the
// real TypeScript sources via Node's type stripping — so the pure logic can be
// verified where vitest/esbuild cannot spawn (DSH sandbox) and nothing is written.
import assert from "node:assert/strict";
import {
  GAMEDOC_SECTIONS,
  annotateDesignDoc,
  checkDesignDocSections,
} from "../src/lib/gamedoc.ts";
import { BOX_TYPES } from "../src/types.ts";
import { fillPromptTemplate, getBoxOutput } from "../src/lib/prompts.ts";

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

// The prompt (in types.ts) and the checker (in gamedoc.ts) are two halves of one
// contract — these are the checks that stop them drifting apart.
check("the box's prompt asks for every section as a readable heading", () => {
  for (const section of GAMEDOC_SECTIONS) {
    assert.ok(
      BOX_TYPES.gamedoc.defaultPrompt.includes(`## ${section}`),
      `prompt is missing "## ${section}"`
    );
  }
});

check("the box's prompt still feeds connected inputs in", () => {
  assert.ok(BOX_TYPES.gamedoc.defaultPrompt.includes("{{inputs}}"));
});

check("a document built from the prompt's own headings passes the check", () => {
  const doc = GAMEDOC_SECTIONS.map((s) => `## ${s}\nplaceholder`).join("\n\n");
  assert.equal(checkDesignDocSections(doc).ok, true);
});

// The demo pipeline: Idea → Game Design Doc → Summarize. Inputs are shaped as
// collectInputs() builds them in boardStore (an Idea box has content, no output).
const idea = (text) => ({ name: "Idea", output: getBoxOutput("", text) });

check("a connected Idea box's text reaches the concept slot", () => {
  const filled = fillPromptTemplate(BOX_TYPES.gamedoc.defaultPrompt, [
    idea("a co-op lighthouse game"),
  ]);
  assert.ok(filled.includes("a co-op lighthouse game"));
  assert.ok(!filled.includes("{{inputs}}"));
});

check("nothing connected yields an honest [no inputs], not an empty brief", () => {
  const filled = fillPromptTemplate(BOX_TYPES.gamedoc.defaultPrompt, []);
  assert.ok(filled.includes("[no inputs]"));
});

check("multiple upstream boxes are labelled inside {{inputs}}", () => {
  const filled = fillPromptTemplate(BOX_TYPES.gamedoc.defaultPrompt, [
    idea("a co-op lighthouse game"),
    { name: "Documents", output: "market research here" },
  ]);
  assert.ok(filled.includes("Idea:"));
  assert.ok(filled.includes("Documents:"));
  assert.ok(filled.includes("market research here"));
});

check("its output AND its warning travel downstream to the next box", () => {
  const partial = "## Concept\nA game.\n";
  const doc = annotateDesignDoc(partial, checkDesignDocSections(partial));
  const downstream = fillPromptTemplate("Summarize this:\n\n{{inputs}}", [
    { name: "Game Design Doc", output: doc },
  ]);
  assert.ok(downstream.includes("Incomplete design document"));
  assert.ok(downstream.includes("Core Loop"));
});

check("a downstream box can reference it by name", () => {
  const downstream = fillPromptTemplate("Build this: {{Game Design Doc}}", [
    { name: "Game Design Doc", output: "## Concept\nA game.\n" },
  ]);
  assert.ok(downstream.includes("A game."));
  assert.ok(!downstream.includes("{{Game Design Doc}}"));
});

console.log(`\nALL ${passed} CHECKS PASSED`);
