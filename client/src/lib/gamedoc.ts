/**
 * Game Design Doc box (🎮 `gamedoc`) — pure helpers.
 *
 * Why this exists: the box's value as a *pipeline* input depends on the document
 * having a stable shape, because the Code box downstream reads those sections.
 * So the app checks the shape itself, in code, instead of asking the model
 * whether it complied — a model that skipped a section is exactly the model that
 * will report that it produced a complete document.
 *
 * Nothing here calls the AI or touches the store: `runBox` orchestrates, this
 * decides. Unit-tested in `gamedoc.test.ts`.
 */

/** The section headings the prompt asks for, in the order it asks for them. */
export const GAMEDOC_SECTIONS = [
  "Concept",
  "Core Loop",
  "Mechanics",
  "Progression",
  "Art & Audio Direction",
  "Scope & Risks",
  "MVP",
] as const;

export interface GamedocCheck {
  /** Sections the model produced, in prompt order. */
  present: string[];
  /** Sections the model did not produce, in prompt order. */
  missing: string[];
  /** True when every required section is present. */
  ok: boolean;
}

/**
 * Normalise a heading for tolerant comparison: lowercase, `&` spelled out, and
 * everything that is not a letter or digit collapsed to single spaces. So
 * "Art & Audio Direction" and "Art and Audio Direction" match each other.
 */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Pull the heading texts out of the model's Markdown. Prefers Markdown ATX
 * headings (`## Concept`); if the model produced none, falls back to full-line
 * bold (`**Concept**`), which some models emit instead.
 */
function headingTexts(markdown: string): string[] {
  const lines = markdown.split(/\r?\n/);

  const atx = lines
    .map((line) => /^\s{0,3}#{1,6}\s+(.*)$/.exec(line))
    .filter((m): m is RegExpExecArray => m !== null)
    .map((m) => m[1].trim());

  if (atx.length > 0) return atx;

  return lines
    .map((line) => /^\s*\*\*(.+?)\*\*\s*:?\s*$/.exec(line))
    .filter((m): m is RegExpExecArray => m !== null)
    .map((m) => m[1].trim());
}

/**
 * Which of the required sections the model actually produced. Tolerant of the
 * small variations a real model makes: extra words in the heading
 * ("## Core Loop (about 30 seconds)"), `&` written as "and", any heading level.
 */
export function checkDesignDocSections(markdown: string): GamedocCheck {
  const headings = headingTexts(markdown).map(normalize);

  const present: string[] = [];
  const missing: string[] = [];

  for (const section of GAMEDOC_SECTIONS) {
    const key = normalize(section);
    const found = headings.some((h) => h === key || h.startsWith(`${key} `));
    (found ? present : missing).push(section);
  }

  return { present, missing, ok: missing.length === 0 };
}

/**
 * Append an honest provenance note when the document is incomplete, so a
 * half-finished document cannot travel downstream looking finished. A complete
 * document is returned byte-for-byte unchanged.
 */
export function annotateDesignDoc(markdown: string, check: GamedocCheck): string {
  if (check.ok) return markdown;
  const them = check.missing.length === 1 ? "it" : "them";
  return (
    `${markdown.trimEnd()}\n\n---\n\n` +
    `> ⚠️ **Incomplete design document.** The model did not produce: ` +
    `${check.missing.join(", ")}. Fill ${them} in before feeding this document ` +
    `to a Code box.\n`
  );
}
