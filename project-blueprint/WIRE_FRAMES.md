0) Shared UI blocks (use everywhere)

Top bar

Search box: “Search patients / phone / ID”

Quick actions (role-based): + New Appointment, + New Patient, + New Episode, + New Encounter

User menu

Left sidebar

Nav items (role-based)

Clinic selector (future multi-clinic)

Right panel (optional)

Context actions + recent activity

1) Dashboard (Doctor)

Goal: show what needs decisions today.

Layout

Header: [Today’s date] [Clinic] [Filters: Today / Week]

Row 1 (KPI cards):

“Patients Today”

“Overdue Follow-ups”

“Red Flags”

“Pending Reviews”

Row 2 (two columns):

Left: Urgent

Red flags list (patient + episode + reason + “Open”)

Overdue tasks list

Right: Work Queues

Pending Review Queue (count + top 5)

Unmatched Inbox (count + top 5)

Row 3:

“Today’s Schedule” (table)

“Recent Submissions” (feed)

Interactions

Clicking any item opens Patient Profile (Episode tab focused)

“Mark as handled” requires note entry (audit)

2) Dashboard (Reception)

Goal: schedule + inquiries + onboarding.

Layout

KPI cards:

“Appointments Today”

“Pending Requests”

“Unmatched Inbox”

“No-shows this week”

Main sections:

Today’s schedule (table)

Appointment requests (queue)

Unmatched WhatsApp inbox (queue)

Quick action: “Register New Patient”

3) Inbox (WhatsApp) — must be first-class
3.1 Inbox Landing

Tabs

Matched

Unmatched (highlighted with badge)

Escalated

Filters

Channel (WhatsApp / Web form)

Status (new / pending / resolved)

Assigned to (user)

List item

Sender name (if matched) or phone number (if unmatched)

Last message preview

Icons: media / document / photo

Timestamp

Status chip (Unmatched / Needs review / Escalated)

3.2 Conversation View (Matched)

Left: thread messages + media thumbnails
Right: Patient quick card

Patient name + ID + phone

Latest episode

Buttons:

Open Patient

Create Task

Request photo/lab

Escalate red flag

3.3 Unmatched Inbox Item (Critical)

Left: message + media preview
Right: resolution panel

Option A: Link to existing patient (search by phone/name)

Option B: Create new patient (mini form)

Option C: Mark non-patient/spam

Option D: Escalate to doctor
Rule: cannot be “resolved” without one of these actions.

4) Schedule (Calendar + List)
4.1 Calendar View

Day/Week toggle

Provider filter (future multi-doctor)

Appointment blocks show:

patient name

type

status color

4.2 Appointment Detail Drawer

Patient info

Reason / notes

Status actions: confirm / reschedule / cancel / check-in / complete

“Send reminder” (WhatsApp template)

5) Patients
5.1 Patients List

Search + filters (age, sex, last visit, has active episode)

Table columns:

Name

Phone

ID

Active episode?

Last visit

Flags (allergy, red flag, overdue)

Row click: opens Patient Profile

5.2 New Patient Form (Reception)

Required: full name, phone, DOB (or age), gender

Optional: national ID, address

Consent checkbox for WhatsApp messaging

Phone verification flow (OTP)

Create patient

6) Patient Profile (core screen)

Tabs (max 6)

Overview

Timeline

Episodes (Surgery)

Encounters

Documents

Messages

6.1 Overview Tab

Patient summary card (demographics, allergies, meds)

Active episode card (if any) with progress

“Quick actions”

New Episode

New Encounter

Upload Document

Send Task

6.2 Timeline Tab (Event feed)

Chronological feed mixing:

appointments

encounters

messages/submissions

task completions

approvals/rejections
Each event shows source: (assistant/doctor/patient WhatsApp)

6.3 Episodes Tab

Episode list (cards)

Procedure, date, status, surgeon

Progress bar: Pre-op → Intra-op → Post-op → Follow-up

“Open episode” button

6.4 Encounters Tab

Table of visits

Create encounter

Open encounter editor

6.5 Documents Tab

Filter by category (Lab / Imaging / Consent / Discharge / Other)

Document cards with preview

“Attach to episode/encounter” action

6.6 Messages Tab

Embedded matched conversation

Shortcut to inbox thread

7) Surgical Episode Detail (the product’s heart)

Header

Episode title: “Procedure — Date”

Status dropdown: planned / pre-op / surgery done / post-op / closed

Buttons:

Add checklist item

Send follow-up task

Add note

Export summary (later)

Main layout: 2 columns

Left: Pathway timeline (vertical)

Sections:

Pre-op

Anesthesia

Surgery

Post-op

Follow-up

Each section contains:

checklist items (with status)

due dates

assigned staff

attachments linked

Right: “What needs attention”

Overdue tasks

Latest patient submissions

Pending AI reviews related to this episode

Red flags

Subsections

7.1 Pre-op checklist view

Table: item / required? / status / due date / attachment link / notes

“Mark as complete” requires who completed it

7.2 Anesthesia assessment

Structured form (ASA class, airway, comorbidities, meds, plan)

Attach labs/ECG

“Finalize” only by anesthesia clinician

7.3 Operative note

Procedure details, findings, complications

Implants/materials

Post-op plan

7.4 Follow-up plan

Task list with schedule offsets (Day 2, Day 7…)

Patient task templates (photo request + symptom score)

Escalation rules preview (if pain > X, fever > Y)

8) Encounter Editor (Doctor)

Structure

Header: patient + date + episode link selector

Sections:

Chief complaint

HPI

Exam

Assessment

Plan

Medications section

Orders section (labs/imaging)

Save draft / Finalize

Rule: finalization locks version; edits create new version.

9) Review Queue (AI extraction) — safety gate
9.1 Queue list

Columns:

Patient

Episode

Source (WhatsApp)

Type (Lab / Wound / Symptoms / Imaging)

Confidence (badge)

Status (new / in review / approved / rejected)

Timestamp

9.2 Review detail split view

Left pane: source message + media preview
Right pane: extracted fields table

Field name | Extracted value | Units | Evidence | Confidence
Actions:

Approve

Edit & Approve

Reject (requires reason)

“Request clarification from patient” (creates task)

Rule: Approve writes to Observations with provenance.

10) Templates (Care Journeys + Messaging)
10.1 Follow-up plan templates

Procedure-specific templates

Task schedule builder

Task content (WhatsApp prompt text)

Required response type: photo / numeric / yes-no / free text

10.2 WhatsApp templates manager (Admin)

Template list + status

Language variants (EN/AR)

Approved vs pending

11) Reports (Doctor/Admin)

Follow-up adherence per procedure

No-show rate

Average time to link unmatched inbox

Complication red flag counts (not “diagnoses”)

12) Settings

Clinic info (hours, address, map link)

Users & roles

Consent text versions

Data retention policy (later)

Integrations (WhatsApp keys/webhook settings)

The 3 traps you must avoid (seriously)

Hiding Unmatched Inbox under “messages” → you will lose patients.

Making encounter the primary screen → episodes get fragmented.

Letting AI auto-write → you’ll corrupt charts and lose trust.

If you want to stay aligned with the post: next is Agent Rules (.cursorrules).
Say: “Step 4: Agent Rules for Cursor” and I’ll generate a strict .cursorrules tailored to this PRD + design system + wireframes so the AI behaves like a disciplined engineer instead of a random generator.