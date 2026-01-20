1) Brand principles (what the UI must feel like)

Clinical, calm, fast.
Your users are stressed and time-poor. The UI must prioritize:

Legibility > beauty

Consistency > novelty

Fewer clicks > extra features

Errors must be obvious and reversible

Tone

Minimal, medical-professional, no “startup flashy”

High contrast, generous spacing, predictable patterns

“Dashboard” look, not marketing look (except landing page)

2) Colors (tokens + meaning)

You need a palette that supports:

clinical neutrality,

urgent flags,

patient safety states,

dark mode later,

Arabic readability.

Core palette (light mode)

Primary (Trust / actions)

Primary 600: #2563EB

Primary 700 (hover): #1D4ED8

Primary 100 (tint bg): #DBEAFE

Neutral (surfaces/text)

Background: #F8FAFC

Surface (card): #FFFFFF

Surface-muted: #F1F5F9

Border: #E2E8F0

Text-primary: #0F172A

Text-secondary: #475569

Text-muted: #64748B

Status colors (clinical meaning)

Use these consistently across badges, alerts, tasks, and dashboard chips:

Success (completed / stable)

Success 600: #16A34A

Success 100: #DCFCE7

Warning (needs attention soon)

Warning 600: #D97706

Warning 100: #FEF3C7

Danger (red flags / urgent)

Danger 600: #DC2626

Danger 100: #FEE2E2

Info (neutral clinical hint)

Info 600: #0891B2

Info 100: #CFFAFE

Guardrails (don’t let the AI improvise)

Red = clinical risk only (not “validation errors”, not “marketing”).

Yellow = needs follow-up, not urgent.

Blue = primary actions and links.

Grey = secondary and inactive.

3) Typography (English + Arabic-ready)

Medical apps die by bad typography. Keep it boring.

Fonts

English: Inter (or system fallback)

Arabic: IBM Plex Sans Arabic (or Cairo)
Your system must support Arabic without layout breaking.

Type scale (minimums)

Page title: 24–28px / semibold

Section title: 18–20px / semibold

Body: 14–16px / regular

Table text: 13–14px

Helper text: 12–13px

Rules

No ultra-light font weights.

Line height: 1.4–1.6 for readability.

Numbers (labs): use tabular numerals if available (avoid misreading values).

4) Layout & spacing (how screens are built)
Grid

Desktop: 12-column grid

Main content max width: 1200–1280px

Sidebar layout for internal app:

Left nav fixed (collapsible)

Content area scrolls

Spacing scale

Use consistent spacing: 4, 8, 12, 16, 24, 32, 48

Cards: padding 16–24

Forms: vertical spacing 12–16 between fields

Tables: row height 44–52 for touch friendliness

Borders & corners

Radius:

Cards: 16px

Inputs/buttons: 10–12px

Border width: 1px

Shadows: subtle only (medical UI should not look “game-y”)

5) Components (exact behavior rules)

You’re likely using shadcn/ui, so lock a predictable design language.

Buttons

Primary: blue background, white text

Secondary: light surface, border

Destructive: red (danger only)

Ghost: for toolbar actions

Rules

Only one primary button per card/section.

Destructive actions require confirmation (modal).

Forms (critical for clinics)

Labels always visible (no “placeholder as label”).

Required fields marked with *.

Validation:

inline message under field

errors summarized at top if >2 fields fail

“Save draft” exists for long forms (anesthesia, operative note).

Tables (you’ll use them everywhere)

Sticky header on scroll

Row hover highlights

Row click opens details (patient/episode)

Inline status chips for:

appointment status,

task status,

review queue status,

red-flag severity.

Badges / chips (status language)

Standardize these statuses everywhere:

Tasks

Scheduled (grey)

Pending patient (blue/info)

Submitted (info)

Needs review (warning)

Approved (success)

Overdue (danger)

Inbox

Matched (success/neutral)

Unmatched (warning)

Escalated (danger)

Alerts

Info: blue

Warning: amber

Danger: red
Danger alerts must include a next action (e.g., “Call patient”, “Escalate to doctor”).

Modals

Use modals only for:

destructive confirmations

critical review decisions

identity linking from unmatched inbox

Never put long forms in modals.

6) Page patterns (repeatable “templates”)

These patterns prevent chaos as the app grows:

A) Dashboard pattern

Top: date range / filters

Left: “Urgent” column (red flags, overdue tasks)

Main: work queues (review queue, today’s schedule, unmatched inbox)

B) Patient profile pattern

Tabs (do not exceed 6):

Overview

Timeline (events feed)

Episodes (surgical)

Encounters

Documents

Messages

Right side panel: quick actions (new appointment, new encounter, send task).

C) Surgical episode pattern (the core)

Header: procedure + date + status

Progress bar: Pre-op → Intra-op → Post-op → Follow-up

Left: checklist/tasks timeline

Right: latest submissions + red flags + pending reviews

D) Review queue pattern (AI extraction)

Split panel:

Left: source message/media preview

Right: extracted fields + confidence + destination mapping
Buttons: Approve / Edit & Approve / Reject
Show provenance always (WhatsApp message id/time).

E) Inbox pattern

Two inboxes:

Matched

Unmatched (must be prominent)

Unmatched item actions:

Link to patient

Create patient

Mark “non-patient” (spam/admin)

7) Motion & micro-interactions (Framer Motion rules)

Motion must be functional, not decorative.

Page transitions: subtle fade/slide (150–220ms)

Expand/collapse: 180ms

Avoid bounce, overshoot, heavy parallax

Use motion for:

drawer open/close,

timeline expansion,

toast notifications.

8) Accessibility (don’t fake it—clinics need it)

Contrast: aim for WCAG AA level (especially text on colored chips)

Minimum touch target: 44px

Keyboard navigation for all forms

Clear focus rings (don’t remove them)

Avoid color-only meaning: pair color with icon/text (“Overdue”, “Urgent”).

9) Iconography

Use one set consistently (Lucide icons recommended)

Only 1–2 icons per button (avoid clutter)

Red flag icon reserved for urgent clinical triggers.

10) Design decisions you must lock now (or you’ll spin forever)

Light mode first (recommended). Add dark mode after workflows stabilize.

Episode-centric UI should be primary for surgical clinics. Encounter-first will fragment the periop workflow.

Arabic support: design must handle RTL later—avoid hard-coded left/right assumptions.

Deliverable output (what you should put in your project folder)

Create these files:

PRD.md (you already have from Step 1)

design-system.md (this step)

If you want to continue exactly in the post order, the next step is Site Map + Wireframes.
Say: “Step 3: Site Map + Wireframes” and I’ll generate:

full page map (public + app),

role-based navigation,

text wireframes for each core screen (so Cursor can build them section-by-section).