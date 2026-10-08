import { describe, expect, it } from "vitest";
import {
  GAMEDOC_SECTIONS,
  annotateDesignDoc,
  checkDesignDocSections,
} from "./gamedoc.js";
import { BOX_TYPES } from "../types.js";
import { fillPromptTemplate, getBoxOutput } from "./prompts.js";

/** A document shaped exactly the way the box's prompt asks for. */
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

describe("checkDesignDocSections", () => {
  it("accepts a document with every required section", () => {
    const check = checkDesignDocSections(COMPLETE);
    expect(check.ok).toBe(true);
    expect(check.missing).toEqual([]);
    expect(check.present).toEqual([...GAMEDOC_SECTIONS]);
  });

  it("names the sections the model skipped", () => {
    const partial = COMPLETE.replace(/## Scope & Risks[\s\S]*?(?=## MVP)/, "");
    const check = checkDesignDocSections(partial);
    expect(check.ok).toBe(false);
    expect(check.missing).toEqual(["Scope & Risks"]);
    expect(check.present).toContain("MVP");
  });

  it("treats an empty reply as entirely missing", () => {
    const check = checkDesignDocSections("");
    expect(check.ok).toBe(false);
    expect(check.missing).toEqual([...GAMEDOC_SECTIONS]);
  });

  it("accepts 'and' where the prompt wrote '&'", () => {
    const doc = COMPLETE.replace("## Art & Audio Direction", "## Art and Audio Direction");
    expect(checkDesignDocSections(doc).ok).toBe(true);
  });

  it("accepts a heading with extra words or a different heading level", () => {
    const doc = COMPLETE.replace("## Core Loop", "### Core Loop (about 30 seconds)");
    expect(checkDesignDocSections(doc).ok).toBe(true);
  });

  it("falls back to full-line bold headings", () => {
    const doc = COMPLETE.replace(/^## /gm, "").replace(/^(.+)$/gm, "**$1**");
    expect(checkDesignDocSections(doc).ok).toBe(true);
  });

  it("does not count a section mentioned only in prose", () => {
    // "MVP" appears in a body sentence but is never a heading of its own.
    const doc = COMPLETE.replace("## MVP\n", "An MVP could follow later.\n");
    expect(checkDesignDocSections(doc).missing).toEqual(["MVP"]);
  });
});

describe("annotateDesignDoc", () => {
  it("returns a complete document unchanged", () => {
    const check = checkDesignDocSections(COMPLETE);
    expect(annotateDesignDoc(COMPLETE, check)).toBe(COMPLETE);
  });

  it("names the missing sections so the gap cannot travel downstream silently", () => {
    const check = checkDesignDocSections("## Concept\nA game.\n");
    const annotated = annotateDesignDoc("## Concept\nA game.\n", check);
    expect(annotated).toContain("Incomplete design document");
    expect(annotated).toContain("Core Loop");
    expect(annotated).toContain("MVP");
    expect(annotated.startsWith("## Concept")).toBe(true);
  });
});

/**
 * The box's prompt and its checker are two halves of one contract: the prompt
 * asks for headings, and the checker reads those same headings back. If someone
 * edits the prompt's section list (the likely thing to tune) without updating
 * GAMEDOC_SECTIONS, the box would start reporting complete documents as
 * incomplete. These tests make that drift impossible to commit silently.
 */
describe("the prompt and the section checker cannot drift apart", () => {
  it("asks the model for every section, as a heading the checker can read", () => {
    for (const section of GAMEDOC_SECTIONS) {
      expect(BOX_TYPES.gamedoc.defaultPrompt).toContain(`## ${section}`);
    }
  });

  it("still feeds the connected inputs into the prompt", () => {
    expect(BOX_TYPES.gamedoc.defaultPrompt).toContain("{{inputs}}");
  });

  it("passes a document built from the prompt's own headings", () => {
    const doc = GAMEDOC_SECTIONS.map((s) => `## ${s}\nplaceholder`).join("\n\n");
    expect(checkDesignDocSections(doc).ok).toBe(true);
  });
});

/**
 * The demo pipeline is Idea → Game Design Doc → Summarize. These check the two
 * things that pipeline actually has to do — the concept must reach this box,
 * and this box's output (including its warning) must reach the next one. Inputs
 * are shaped exactly as `collectInputs()` builds them in boardStore.ts: an Idea
 * box has `content` and no `output`, so `getBoxOutput` yields the typed text.
 */
describe("composes with the boxes either side of it (Idea → gamedoc → Summarize)", () => {
  const idea = (text: string) => ({ name: "Idea", output: getBoxOutput("", text) });

  it("passes a connected Idea box's text into the concept slot", () => {
    const filled = fillPromptTemplate(BOX_TYPES.gamedoc.defaultPrompt, [
      idea("a co-op lighthouse game"),
    ]);
    expect(filled).toContain("a co-op lighthouse game");
    expect(filled).not.toContain("{{inputs}}");
  });

  it("says so when nothing is connected, instead of sending an empty brief", () => {
    const filled = fillPromptTemplate(BOX_TYPES.gamedoc.defaultPrompt, []);
    expect(filled).toContain("[no inputs]");
  });

  it("labels multiple upstream boxes inside {{inputs}}", () => {
    const filled = fillPromptTemplate(BOX_TYPES.gamedoc.defaultPrompt, [
      idea("a co-op lighthouse game"),
      { name: "Documents", output: "market research here" },
    ]);
    expect(filled).toContain("Idea:");
    expect(filled).toContain("Documents:");
    expect(filled).toContain("market research here");
  });

  it("carries its output — and the incomplete-document warning — downstream", () => {
    const partial = "## Concept\nA game.\n";
    const doc = annotateDesignDoc(partial, checkDesignDocSections(partial));
    const downstream = fillPromptTemplate("Summarize this:\n\n{{inputs}}", [
      { name: "Game Design Doc", output: doc },
    ]);
    // The warning travelling with the text is the point of the design: a
    // half-finished document must not arrive at the Code box looking finished.
    expect(downstream).toContain("Incomplete design document");
    expect(downstream).toContain("Core Loop");
  });

  it("can be referenced by name from a downstream box", () => {
    const downstream = fillPromptTemplate("Build this: {{Game Design Doc}}", [
      { name: "Game Design Doc", output: "## Concept\nA game.\n" },
    ]);
    expect(downstream).toContain("A game.");
    expect(downstream).not.toContain("{{Game Design Doc}}");
  });
});
