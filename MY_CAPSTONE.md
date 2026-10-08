# My Capstone — "One Student, One Box" 🎮

> **Personal working document.** Not part of the app. If your instructor wants your PR to contain
> only the box and its docs, delete this file (or move it outside the repo) before you open the PR.
> Everything in `client/` and `docs/` *is* your submission.

**My box:** 🎮 **Game Design Doc** (`gamedoc`) — turns a game concept into a structured design
document, designed to sit **before** a Code box.

**My assigned research topic:** *How AI coding can help make coding better.*

---

## ⚠️ The one thing blocking your demo right now

`server/.env` has an **`OLLAMA_API_KEY` line that is empty**. The box is built and typechecked, but
it has **never been run against a real model**, because there is no key to run it with. Every Run
will fail with a red banner until you fix this, and your demo *and* both evidence experiments
(§4) are blocked on it.

**Fix (1 minute):**

1. Get a key from your Ollama account (the same one the rest of the class uses).
2. Put it in `server/.env` on the `OLLAMA_API_KEY=` line, with no quotes and no spaces:
   `OLLAMA_API_KEY=your-key-here`
3. **Restart `npm run dev`** — the server reads `.env` only at startup.

Then do §3. If it still fails, check the box's red error banner first — it names the reason.

---

## 0. Do this first: settle the research question (one email)

The brief says each box comes with its own research question, and that this is what you write
about. For **Game Design Doc** the brief's question is *"Can an LLM reason about fun?"* — but you
were given a different topic. Those need reconciling before you write anything long.

**Recommended framing** (keeps your box, answers your assigned topic, and is testable):

> **"Does an AI-generated design document actually make the downstream code better — or does it
> just sound confident?"**

The bridge: a design document is a *specification*, and the coding that follows it is only as good
as that specification. Your box produces the input that coding consumes, so you can measure the
effect instead of asserting it. **METR's own factor analysis backs this up** — they attribute part
of AI's slowdown to work with "many implicit requirements" (see §7). Your box's job is to make the
requirements explicit.

**Send your instructor exactly this:**

> I've chosen the Game Design Doc box. Can I frame my report around the assigned topic "How AI
> coding can help make coding better" by asking whether an AI-generated design doc improves the
> downstream code — i.e. I test my box feeding a Code box, with and without the doc? Or do you want
> me to use the box's own research question ("Can an LLM reason about fun?") instead?

Until they reply, **keep building** — the code is identical either way.

---

## 1. What a "box" is (the part the how-to guide assumes you know)

- The **canvas** is a whiteboard. A **box** is a card on it.
- You **connect** cards by dragging from the right `●` of one to the left `●` of another.
- Text flows along those lines: a downstream box's prompt can read the boxes upstream of it.
- **▶ Run** = "take this box's prompt, paste in whatever is connected to it, send it to the AI,
  store the reply on the box."
- A **pipeline** is a chain: `Idea → my box → Summarize`.
- The brief's **"three touchpoints"** are the three places the app must know about your box:
  *what it's called* (`types.ts`), *what Run does* (`boardStore.ts`), *how it looks* (`BoxNode.tsx`).

---

## 2. Already done for you (verify it yourself, don't take it on faith)

- [x] **Touchpoint 1 — identity.** `"gamedoc"` added to the `BoxType` union and a `BOX_TYPES`
      entry written in `client/src/types.ts` (label, 🎮, colour, `category: "worker"`,
      `roles`, prompt, system prompt).
- [x] **Touchpoint 2 — behaviour.** A `gamedoc` branch in `runBox`
      (`client/src/store/boardStore.ts`) that checks the reply's shape and marks an incomplete
      document, instead of trusting the model to have produced all seven sections.
- [x] **The checking logic** lives in `client/src/lib/gamedoc.ts` with tests in
      `client/src/lib/gamedoc.test.ts` (**17 checks — verified passing against the real sources**).
- [x] **The demo pipeline's wiring is verified too:** a connected Idea box's text reaches this box's
      concept slot, an unconnected box honestly reports `[no inputs]` rather than sending an empty
      brief, multiple upstream boxes are labelled, and this box's output *including its ⚠️ warning*
      reaches the next box. (All verified — but note the warning at the top of this file: none of
      this has yet run against a real model.)
- [x] **Docs** updated: `docs/BOX_TYPES.md`, `AGENTS.md`, `docs/DEVLOG.md`.

**Still yours to do:** run it, demo it, gather evidence, write the report, and remove the temp
folder in step 5.

---

## 3. See it work (do this now — 5 minutes)

1. [ ] `npm run install:all` (once), then `npm run dev`. Client on `localhost:5173`.
2. [ ] Put a real `OLLAMA_API_KEY` in `server/.env`, then restart. Without it every Run fails.
3. [ ] **+ Add Box → Workers → 🎮 Game Design Doc.** Drop it on the canvas.
4. [ ] Add an **Idea** box; type a game concept, e.g. *"a 2-player co-op game where one player is
       the lighthouse keeper and the other is a ship."*
5. [ ] Drag from the Idea's right `●` to the Game Design Doc's left `●`.
6. [ ] Press **▶ Run** on the Game Design Doc.
7. [ ] Confirm you get seven sections: Concept, Core Loop, Mechanics, Progression,
       Art & Audio Direction, Scope & Risks, MVP.
8. [ ] Add a **Summarize** box downstream of it and Run — that's the "composes with other boxes"
       half of the demo mark.

**If it breaks:**

| Symptom | Cause | Fix |
|---|---|---|
| Box not in the sidebar | union / `BOX_TYPES` mismatch | Check `client/src/types.ts` for both |
| Everyone errors instantly | no API key | `server/.env` → `OLLAMA_API_KEY` |
| Output empty | nothing connected | Connect an Idea box and re-run |
| TypeScript errors | a broken edit | `cd client; npx tsc -p tsconfig.json` |

---

## 4. Gather your evidence (this is the 70%)

Do this **while** you build — you cannot reconstruct it later.

### Experiment A — does the document change the code? (your headline result)

1. [ ] Run `Idea(concept) → Code` **without** the design doc. Save the generated code.
2. [ ] Run `Idea(concept) → Game Design Doc → Code` **with** it. Save that code.
3. [ ] Compare them on things you can count: does each one run in the preview? how many of the
       document's features actually appear? how much did you have to ask it to change?
4. [ ] Repeat for **3 different concepts** — one run each way is an anecdote, three is a pattern.

### Experiment B — does the model actually follow the spec? (your honesty result)

1. [ ] Run the box **5 times** on the same concept.
2. [ ] Count how often each of the seven sections is missing (the box's own ⚠️ note tells you).
3. [ ] That count is your evidence for the limits section. "2 of 5 runs silently dropped
       `Scope & Risks`" is a finding; "AI is sometimes unreliable" is not.

### Also collect, as you go

- [ ] The exact prompts you tried and **why you changed them** (this is your design rationale).
- [ ] Any output that sounded confident but was unbuildable — a direct quote is worth a paragraph.
- [ ] Token counts shown on the box footer (cost of the approach, if you want a trade-off point).

---

## 5. Clean up before you submit

- [ ] **Delete the temp verification folder.** Commands could not remove it when it was created:
      `Remove-Item -Recurse -Force client\.tscheck`
- [ ] Run the real test suite in a normal shell: `npm test` (it cannot run inside the AI agent's
      sandbox — the test runner's helper process is blocked there).
- [ ] `cd client; npx tsc -p tsconfig.json` — must exit 0.

---

## 6. The report (2,000–2,500 words) — section by section

| # | Section | Marks | Words | What goes in mine |
|---|---|---|---|---|
| 1 | Problem & motivation | 15% | ~350 | Small teams skip or rush design docs; coders then guess from a vague idea. Name the beneficiary: the coder receiving the doc. |
| 2 | Domain context | 15% | ~450 | Evidence on AI coding assistance and on how unclear requirements turn into defects and rework. Cited. |
| 3 | Design rationale | 15% | ~450 | Why seven fixed headings (machine-followable by the Code box), why "name real numbers" (against plausible filler), why the `UNKNOWN — needs a decision:` escape hatch, why plain Ollama text. |
| 4 | Alternatives | 10% | ~350 | A human designer; a deterministic template/form instead of an LLM; a different model. Trade-offs of each. |
| 5 | Ethics & limits | 10% | ~350 | Confident-sounding filler; a doc that *looks* complete; accountability when code fails because the doc was wrong; what my box does about it (the shape check + warning). |
| 6 | Answer to my question | 5% | ~250 | Experiment A + B results. Be willing to conclude "no". |

**Two traps:** don't let section 6 become a summary of sections 1–5 (it must be a *verdict*), and
don't cite anything you haven't opened.

---

## 7. Sources — 5 fetched and verified for you (M1 needs 3)

I fetched and read these myself on 2026-10-08, so the numbers below are quoted from the actual pages
(not from memory). Open them anyway — you must be able to defend anything you cite.

**The tension that makes your report interesting:**

| Study | Task realism | Result |
|---|---|---|
| Peng et al. 2023 (Copilot) | One fixed exercise: build an HTTP server in JS | **55.8% faster** |
| METR early-2025 | Real PRs in large open-source repos they maintain | **19% slower** |
| METR Feb 2026 update | Same approach, one year later | speedup — but METR says their data can't measure it |

1. **Peng, Kalliamvakou, Cihon & Demirer (2023), _The Impact of AI on Developer Productivity:
   Evidence from GitHub Copilot_** — <https://arxiv.org/abs/2302.06590>
   Controlled experiment; the AI group completed an HTTP-server task **55.8% faster**. Use it as the
   *optimistic* baseline, and note what it measured: one self-contained task with no legacy context.
   → §2 and §4

2. **Becker, Rush, Barnes & Rein (2025), _Measuring the Impact of Early-2025 AI on Experienced
   Open-Source Developer Productivity_** —
   <https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/> (paper:
   [arXiv:2507.09089](https://arxiv.org/abs/2507.09089))
   RCT with 16 experienced developers, 246 real issues, repos averaging 22k+ stars / 1M+ lines.
   **AI made them 19% slower.** The perception gap is the headline: developers **forecast a 24%
   speedup**, and **after experiencing the slowdown still believed they had been sped up by 20%**.
   Their factor analysis suggests the slowdown relates to work with **"very high quality standards,
   or with many implicit requirements (e.g. relating to documentation, testing coverage, or
   linting/formatting)"**. That sentence is why your box is worth building — read it twice.
   → §2 and §5

3. **METR (Feb 2026), _We are Changing our Developer Productivity Experiment Design_** —
   <https://metr.org/blog/2026-02-24-uplift-update/>
   The update to source 2, and **you must cite it** if you say anything about AI's *current* impact:
   METR now believes it is "likely that developers are more sped up from AI tools now — in early
   2026". Their later study (57 devs, 143 repos, 800+ tasks) estimates **-18%** for returning devs
   (CI -38% to +9%) and **-4%** for new devs (CI -15% to +9%) — while calling that data "only very
   weak evidence", because **30–50% of developers refused to submit tasks they did not want to do
   without AI**. Citing this proves you checked whether your source was still true.
   → §2

4. **Spracklen et al. (2025), _We Have a Package for You! A Comprehensive Analysis of Package
   Hallucinations by Code Generating LLMs_** — <https://arxiv.org/abs/2406.10279>
   (USENIX Security 2025.) 16 models, 576,000 generated code samples. **At least 5.2% of packages
   recommended by commercial models did not exist; 21.7% for open-source models** — 205,474 unique
   fake names. Directly relevant: this app runs a **self-hosted open-source model**, which is the
   higher-error column. A quantified limitation for your ethics section. → §5

5. **Stack Overflow Developer Survey 2025, AI section** — <https://survey.stackoverflow.co/2025/ai>
   33,662 respondents. **84% use or plan to use AI tools** (up from 76% last year); **51% of
   professional developers use them daily**. Yet favourable sentiment **fell from 70%+ in 2023 and
   2024 to 60% in 2025**. Adoption up, enthusiasm down — a strong way to open §1. → §1

**How these fit your argument (the honest version).** METR's factor analysis points at *implicit
requirements* as one place AI coding underperforms. Your box's entire job is to make requirements
explicit and complete. So your hypothesis is: **forcing the specification into a fixed, fully
populated shape should improve the code that follows it.** That is a hypothesis you test — METR's
finding is about repository conventions and quality bars generally, **not** about design documents
specifically. Say that limitation plainly and your §6 verdict becomes credible instead of
overclaimed.

**Still worth finding if you want a sixth:** Google Cloud's DORA report on AI-assisted software
development (I could not confirm a stable URL), and requirements-engineering work on requirements
quality versus defect cost.

---

## 8. Demo script (5 minutes)

1. [ ] Show the box alone: concept in → seven-section document out. *(reads inputs, well-formed)*
2. [ ] Show the pipeline: Idea → Game Design Doc → Code → preview. *(composes)*
3. [ ] Show the ⚠️ incomplete-document case, honestly. *(limits — this is a mark, not a weakness)*
4. [ ] Show Experiment A's two code outputs side by side. *(evidence)*
5. [ ] One sentence on what you'd change next.

---

## 9. Open decisions I left for you (each is defensible either way)

- [ ] **Should the Agent box be allowed to create a Game Design Doc?** Not enabled. Enabling it
      (`AGENT_CREATABLE_TYPES` in `client/src/lib/agent.ts`) lets an agent author its own
      specifications — the same reason the SDLC stages are excluded. Either answer is a good
      paragraph in your ethics section.
- [ ] **Should the ⚠️ warning be stored on the box instead of appended to the text?** Appending
      means downstream boxes see it (honest) but the downloaded `.md` carries it (noisier). Current
      choice: append.
