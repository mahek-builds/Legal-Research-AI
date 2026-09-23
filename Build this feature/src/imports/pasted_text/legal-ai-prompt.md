# Figma Design Prompt — Legal Research AI Agent

A complete, ready-to-paste prompt for Figma AI / Figma First Draft / Uizard / v0 / any AI design generator, plus a manual design brief a human designer can follow. Covers brand direction, full design system, every screen, every state, and responsive/accessibility notes.

---

## 1. How to use this document

- **Paste Section 3 (Master Prompt)** directly into Figma's "First Draft" AI prompt box, or into any text-to-UI tool, to generate a first-pass file.
- **Use Sections 4–9** as the design system and screen-by-screen spec to refine that draft manually in Figma.
- **Use Section 10** as your component/frame checklist before handoff to engineering.

---

## 2. Product Context (for the designer / AI)

A legal research assistant for lawyers, paralegals, and law students. Users upload case files, judgments, contracts, or statutes, then ask legal questions in a chat-style research interface. The system searches uploaded documents, searches the live legal web (court sites, gazettes, statute databases), or both — then returns structured, cited answers. Users can ask follow-up questions that reference earlier findings ("tell me more about the second issue"). The product must feel like a **precise, trustworthy research tool**, not a casual chatbot — closer to Westlaw/LexisNexis/Bloomberg Law in tone than to a consumer AI app, but with the fluid interaction quality of modern AI products like Claude or ChatGPT.

**Primary users:** litigators, in-house counsel, paralegals, law students.
**Core emotion to design for:** confidence, precision, calm authority. Never playful, never cluttered.

---

## 3. Master Prompt (paste into Figma AI / text-to-UI tool)

```
Design a professional legal research web application called "LexAgent" (working name).
It is a research tool for lawyers combining document upload, RAG-based document search,
live legal web search, and a conversational research agent with memory.

STYLE: Serious, authoritative, editorial legal-tech aesthetic — think Westlaw/Bloomberg
Law crossed with the clean interaction design of Claude/Linear/Notion. NOT playful,
NOT consumer-startup-colorful. Generous whitespace, strong information hierarchy,
dense-but-organized data display for citations and sources.

COLOR PALETTE: Deep navy/ink (#0B1220 or similar) as primary brand color, warm off-white
background (#FAFAF7), a muted gold/brass accent (#B08D57) used sparingly for highlights
and active states (evokes legal/judicial gravitas — think a brass nameplate, not bright
yellow), a slate gray for secondary text (#5B6472), and a clear semantic red/amber/green
for conflicting authorities, warnings, and confirmations. Support both light and dark mode,
dark mode using a charcoal-navy (#12161F) background.

TYPOGRAPHY: A serif display face (e.g. "Source Serif 4", "Lora", or "Merriweather") for
headings, case names, and quoted legal text — signals legal-document credibility. A clean
grotesk sans (e.g. "Inter" or "IBM Plex Sans") for UI chrome, buttons, labels, and body
text in the chat. Monospace (e.g. "IBM Plex Mono") for statute/section numbers and citation
strings.

LAYOUT: Three-pane app shell.
- LEFT SIDEBAR (~280px, collapsible): conversation/session history list, "New Research"
  button, uploaded document library with processing-status badges, user account footer.
- CENTER (fluid, main focus): the research conversation thread — query bubbles, agent
  responses structured into collapsible sections (Summary, Relevant Facts, Legal Issues,
  Applicable Law, Court Reasoning, Precedents, Analysis, Conclusion, Sources), a visible
  "agent reasoning trace" showing Understand → Plan → Retrieve → Reason → Cite as a subtle
  step tracker while the agent works, and a query input bar pinned to the bottom with a
  toggle for "Documents / Web / Both" search scope.
- RIGHT PANEL (~340px, collapsible, appears when sources exist): live Sources & Citations
  panel — cards per source showing type icon (document vs. web), title, court/authority,
  date, page/paragraph or URL, and a "view in context" action. Includes a "Conflicting
  Authorities" flagged state with amber styling when two sources disagree.

KEY SCREENS TO DESIGN:
1. Empty state / new session — upload dropzone + suggested query chips.
2. Document upload & processing — drag-drop, per-file progress bar, status chips
   (Uploading, Extracting, Chunking, Embedding, Ready, Failed).
3. Active research conversation — multi-turn thread with structured answer cards,
   inline citation markers ([1], [2]) that hover-preview the source, and a visible
   research-progress stepper during agent execution.
4. Source detail / citation drawer — slide-over panel with full citation metadata and
   original excerpt.
5. Conflicting authorities view — two source cards side by side with a connecting
   "conflicts with" indicator in amber.
6. Session/history sidebar with search and rename.
7. Settings — model selection, source-reliability preferences, data retention.
8. Responsive mobile view — collapse to single-pane with bottom sheet for sources.

COMPONENTS TO INCLUDE IN A SHARED LIBRARY: buttons (primary/secondary/ghost/danger),
input fields, search bar with scope toggle, file upload card, status badge, citation
chip, source card, collapsible answer section, agent step tracker, chat bubble
(user + agent), empty state, toast/notification, modal, skeleton loaders, and a
conflict-flag banner.

Generate high-fidelity frames at desktop (1440px) and mobile (390px) widths, using
an 8px spacing grid and consistent 12px corner radii on cards, 8px on buttons/inputs.
```

---

## 4. Brand & Visual Identity

| Element | Direction |
|---|---|
| Name direction | "LexAgent," "Statute," "Brief," "Jurist" — working name: **LexAgent** |
| Tone | Authoritative, precise, calm, trustworthy — never cute or casual |
| Logo concept | A simple serif wordmark with a minimal gavel/column/scale glyph reduced to geometric lines (avoid literal clip-art scales-of-justice) |
| Motion | Subtle, purposeful only — fade/slide on content reveal, a slow progress pulse on the agent's reasoning stepper. No bouncy or playful easing. |

---

## 5. Color System

**Light mode**
- Background: `#FAFAF7` (warm paper white)
- Surface / card: `#FFFFFF`
- Primary (ink navy): `#0B1220`
- Accent (brass/gold): `#B08D57`
- Secondary text: `#5B6472`
- Border: `#E4E2DC`
- Success: `#2F855A`
- Warning / Conflict: `#B7791F`
- Error: `#C53030`
- Info: `#2B6CB0`

**Dark mode**
- Background: `#12161F`
- Surface / card: `#1A2030`
- Primary text: `#F5F3EE`
- Accent (brass/gold): `#D3A863`
- Border: `#2A3142`
- Semantic colors: same hues, raised ~10% luminance for contrast

**Usage rule:** brass/gold accent is reserved for active states, citation markers, and the reasoning-stepper's active step — never used as a large fill, to keep the palette restrained and legal-editorial rather than decorative.

---

## 6. Typography Scale

| Token | Font | Size / Line-height | Use |
|---|---|---|---|
| Display | Source Serif 4, 600 | 32/40 | Page/session titles |
| H1 | Source Serif 4, 600 | 24/32 | Section headers (e.g. "Court Reasoning") |
| H2 | Source Serif 4, 600 | 18/26 | Card titles, case names |
| Body | Inter, 400 | 15/24 | Chat text, descriptions |
| Body Small | Inter, 400 | 13/20 | Metadata, timestamps |
| Label | Inter, 500, uppercase, tracked | 11/16 | Status badges, section eyebrows |
| Citation / Code | IBM Plex Mono, 400 | 13/20 | Section numbers, statute citations, URLs |

---

## 7. Core Layout — Desktop (1440px)

```
┌──────────┬────────────────────────────────────────┬──────────────┐
│ Sidebar  │              Research Thread             │  Sources     │
│ 280px    │              fluid (~740–820px)          │  340px       │
│          │                                          │              │
│ + New    │  [User query bubble]                     │  Filter:     │
│ Research │  ┌────────────────────────────────────┐  │  All/Doc/Web │
│          │  │ Agent step tracker (Understand→     │  │              │
│ Sessions │  │ Plan→Retrieve→Reason→Cite)           │  │  [Source     │
│  • ...   │  └────────────────────────────────────┘  │   card] [1]  │
│  • ...   │  ▸ Summary                                │  [Source     │
│          │  ▸ Relevant Facts                         │   card] [2]  │
│ Documents│  ▸ Legal Issues                           │              │
│  • file  │  ▸ Applicable Law                         │  ⚠ Conflict  │
│    Ready │  ▸ Court Reasoning                        │  banner if   │
│  • file  │  ▸ Relevant Precedents                    │  applicable  │
│  Process-│  ▸ Analysis                                │              │
│  ing...  │  ▸ Conclusion                             │              │
│          │  ▸ Sources [1][2][3]                      │              │
│ Settings │                                            │              │
│ Account  │  [Query input bar: Documents/Web/Both ⚬]   │              │
└──────────┴────────────────────────────────────────┴──────────────┘
```

- Sidebar and Sources panel are independently collapsible (icon toggle in top bar).
- Answer sections are **collapsible accordions**, default-expanded for Summary and Conclusion, collapsed for the rest, so a user scans fast and drills in.
- Inline citation markers `[1]` `[2]` are brass-colored, clickable, and open the Source detail drawer or scroll-highlight the matching card in the right panel.

---

## 8. Screen-by-Screen Spec

### 8.1 Empty State / New Session
- Centered upload dropzone (dashed border, document-stack icon) with text "Drop legal documents here, or click to upload — PDF, DOCX, TXT."
- Below it, 4–6 suggested query chips reflecting example workflows (e.g. "Summarize the key issues in this judgment," "Find recent SC judgments on Section 438 CrPC").
- Query input bar is present and usable even with zero documents (enables web-only research).

### 8.2 Document Upload & Processing
- Drag-and-drop zone plus a file list below it.
- Each file row: file icon (by type), file name, size, and a **status badge** that transitions through: `Uploading → Extracting Text → Chunking → Generating Embeddings → Ready` with a thin progress bar; `Failed` state shown in error red with a retry action.
- Each ready file shows page count and a small "view" action to preview extracted text.
- Remove (×) action per file, with confirm-on-hover for destructive clarity.

### 8.3 Active Research Conversation
- User turns: right-aligned bubble, navy background, white text, serif for any quoted legal text within it.
- Agent turns: left-aligned, full-width card (not a bubble) — because legal answers are structured documents, not casual chat text.
- **Agent step tracker**: a thin horizontal stepper (Understand → Plan → Retrieve → Reason → Synthesize → Cite) shown live while processing, each step animating a subtle pulse, collapsing to a single "Research complete · 4 sources · 2.3s" line once done (expandable to re-view the trace — this demonstrates the real agent workflow to evaluators/users, not just an LLM call).
- Structured answer as accordion sections per Section 7.
- Follow-up suggestion chips below each agent answer (e.g. "Tell me more about the second issue," "Compare with the 2019 ruling") to visibly demonstrate context retention.
- Query input bar: text field, a **scope toggle** (segmented control: Documents / Web / Both — agent's own choice is shown as a subtle badge like "Agent used: Documents + Web" if the user leaves it on Auto), attach-file icon, send button.

### 8.4 Source Detail / Citation Drawer
- Slides in from the right (or expands the right panel item).
- For document sources: document name, page number, section/paragraph, a highlighted excerpt in serif type mimicking the original document, "Open full document" action.
- For web sources: title, court/authority name, date, full URL (monospace, truncated with copy button), a short extracted excerpt, and a reliability tag (e.g. "Official Court Website," "Government Gazette," "Secondary Commentary") to make source-tier transparent.

### 8.5 Conflicting Authorities View
- Two (or more) source cards shown connected by a visual bracket/connector labeled "Conflicting positions" in amber.
- Each card shows its holding in one line plus full citation.
- A dismissible amber banner above the answer: "⚠ Sources disagree on this point — reviewed both below" rather than silently merging them.

### 8.6 Sidebar — Sessions & Documents
- Sessions list: title (auto-generated from first query), relative timestamp, hover reveals rename/delete.
- Documents list scoped to the active session, each with status badge; a small "used in this answer" checkmark appears on documents the agent actually retrieved from for the current turn (reinforces trust/transparency).

### 8.7 Settings
- Model/provider selection, source-reliability tiering preferences (e.g. prioritize .gov/.nic.in/court domains), data retention toggle, light/dark mode.

### 8.8 Mobile (390px)
- Single-pane: thread is primary; sidebar and sources become slide-in drawers triggered by header icons.
- Query input bar sticky at bottom above the OS safe area; scope toggle collapses into a small icon-only segmented control.
- Accordion sections behave identically, full-width.

---

## 9. Component Library Checklist

- [ ] Buttons: primary (navy fill), secondary (outline), ghost, destructive (red), all with hover/active/disabled/loading states
- [ ] Input field (text), textarea (query box, auto-grow), search field
- [ ] Segmented control (Documents / Web / Both / Auto)
- [ ] File upload card + status badge (5 states: uploading, extracting, chunking, embedding, ready, failed)
- [ ] Chat bubble — user variant
- [ ] Structured answer card — agent variant, with accordion sub-sections
- [ ] Agent reasoning stepper (live + collapsed states)
- [ ] Citation chip / inline marker
- [ ] Source card (document variant, web variant)
- [ ] Conflict banner + connector
- [ ] Session list item
- [ ] Empty state illustration/block
- [ ] Toast / inline notification (success, error, info)
- [ ] Modal / confirm dialog
- [ ] Skeleton loaders (thread loading, sources loading)
- [ ] Top bar (collapse toggles, session title, theme switch)
- [ ] Suggested-query / follow-up chip

---

## 10. Accessibility & Responsiveness Notes

- Maintain WCAG AA contrast, especially brass-on-white (verify at ≥4.5:1 for text use; use brass only on large/bold text or as a non-text accent otherwise).
- All interactive citation markers and status badges need a non-color signal too (icon or label), not color alone.
- Keyboard navigation: full flow through upload, query input, accordion expand/collapse, and citation drawer.
- Reflow gracefully from 1440px → 1024px (panels stack/collapse) → 390px (drawer pattern).

---

## 11. Deliverable Structure in Figma

1. **Cover page** — product name, one-line description, palette + type swatches.
2. **Design tokens page** — color, type, spacing, radius, elevation styles as Figma styles/variables.
3. **Component library page** — all components from Section 9 with variants.
4. **Desktop flows page** — all screens from Section 8 at 1440px, connected with prototype links (upload → process → query → answer → citation drawer → conflict view).
5. **Mobile flows page** — same flow at 390px.
6. **Dark mode page** — key screens duplicated in dark mode to prove the token system holds up.