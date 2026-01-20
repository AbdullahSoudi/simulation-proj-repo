PRD — Surgical Clinic OS (Web + Mobile + WhatsApp Automation)
1) Document control

Product name: Surgical Clinic OS (working name)

Version: v1.0

Owner: Khaled (Product Owner)

Target release: MVP in phases (see roadmap)

Platforms: Web app (MVP), Mobile app (v2), WhatsApp automation (MVP)

2) Problem statement (what pain we solve)

Surgical clinics (especially in Egypt and similar markets) lose time and quality because:

Patient communication is fragmented (calls, WhatsApp, paper).

Clinical data is scattered (labs/images in chats, paper files).

Surgical pathway follow-up is inconsistent (patients forget instructions, complications missed early).

Staff need a workflow that matches reality: reception → clinic visit → anesthesia clearance → surgery → post-op follow-ups.

We need one system that becomes the clinic’s “operating system” across the full surgical episode, with structured data capture, task-driven follow-up, and WhatsApp ingestion—without unsafe automation.

3) Product vision (one sentence)

A clinic platform that makes surgical care organized, trackable, and automatable: from booking → charting → perioperative pathways → WhatsApp follow-up, with AI assisting but humans approving what becomes “official record.”

4) Goals & success metrics
Primary goals (MVP)

Reduce admin workload for reception + assistants.

Increase follow-up adherence post-op (tasks completed on time).

Increase data completeness: labs/images uploaded and linked to correct patient/episode.

Avoid unsafe automation: nothing clinical enters the chart without review.

Success metrics (measure within 60–90 days after pilot)

≥ 60% of post-op patients complete scheduled follow-up tasks on time.

≥ 80% of inbound WhatsApp media gets correctly linked to a patient and episode within 24 hours.

≥ 30% reduction in staff time spent searching chats/files for labs/images.

< 1% “wrong patient linkage” incidents (must be near-zero).

WhatsApp delivery success rate > 95% for reminders (where templates are allowed).

5) Non-goals (explicitly NOT in MVP)

Be strict here, or you’ll never ship.

Full hospital-grade EHR or billing engine (beyond basic receipts/fees)

Automated clinical diagnosis/decision-making

“Convert x-ray image to numbers” as a reliable default (not realistic without radiology reports; images can be stored, routed, and reviewed, but numeric extraction is optional and limited)

6) Key constraints (reality checks)

WhatsApp is policy-governed. You can’t message people freely; template rules and enforcement exist.

WhatsApp integration must use official webhooks for reliability and compliance.

Phone number is not a perfect identity. People change numbers/share phones → you need verification + re-linking.

7) Personas & roles (RBAC required)
Clinic-side

Doctor (Owner/Clinician)

Reception / Clinic Assistant

Anesthesia Clinician

Surgical Assistant / Nurse

Admin (Business Ops / System Admin)

Patient-side

Patient (WhatsApp-first; portal/app later)

Permission principles

Assistants can create drafts, upload documents, triage inbox.

Clinicians finalize notes and approve extracted results.

Every sensitive action is audit-logged.

8) Core user journeys (end-to-end)
Journey A: “Patient asks on WhatsApp → booking → visit”

Patient sends message asking for timing/location or booking.

System receives via WhatsApp webhook and routes:

If matched to verified patient: goes to patient thread.

If unknown: goes to Unmatched Inbox.

Reception responds or sends booking options.

Appointment created; reminders scheduled.

Journey B: “Clinic visit → prescription/orders → files”

Assistant opens patient profile and starts a visit intake.

Doctor documents encounter note and prescribes medication/orders.

Any labs/imaging are tracked with status: ordered → received → reviewed.

Documents uploaded and linked to encounter and/or episode.

Journey C: “Surgical episode workflow”

Create Surgical Episode (procedure name, date, facility).

Pre-op checklist assigned (labs, ECG, imaging, clearance).

Anesthesia clinician completes pre-anesthesia assessment.

Surgery occurs; post-op note + instructions recorded.

Follow-up plan auto-schedules tasks and WhatsApp prompts.

Journey D: “Post-op follow-up via WhatsApp (media + AI extraction + review)”

Patient receives a scheduled prompt: “Send wound photo + pain score.”

Patient replies with photo/text.

AI classifies content and drafts extracted observations.

Assistant/clinician reviews in Review Queue and approves into chart.

If red flags appear, system escalates to doctor and starts a defined protocol.

This “digital care journey” pattern is how leading perioperative tools frame the problem: education + symptom monitoring + alerts + dashboards across pre/post surgery.

9) Functional requirements (by module)
9.1 Authentication & access control

Email/password (clinic staff), with optional 2FA later

Role-based access control (RBAC)

Audit logging of:

logins, record access, edits, approvals/rejections

9.2 Patient registry & identity

Create/edit patient demographics

Verify phone (OTP) and link to patient UUID

Identity history (phone change, re-verify)

Consent capture (WhatsApp messaging + data processing + media storage)

9.3 Scheduling & clinic operations

Clinic locations + working hours + exceptions

Appointment types (consultation, pre-op review, post-op follow-up)

Appointment lifecycle (requested/confirmed/checked-in/completed/no-show)

Automated reminders (WhatsApp template if required, fallback channel later)

Public “clinic info” landing page (hours/location/contact/booking request)

9.4 EHR-lite (encounters + meds + orders + docs)

Borrow proven EHR-lite structure (patients, scheduling, charts, documents) common in practice management systems.

Encounter note templates (SOAP or structured sections)

Medication prescribing (drug, dose, frequency, duration, instructions)

Lab orders and results tracking

Imaging orders and results tracking

Document management:

upload PDFs/images

categorize (lab, imaging, consent, discharge, other)

link to encounter and/or surgical episode

9.5 Surgical Episode (the core differentiator)

Create episode (procedure, scheduled date, surgeon, facility)

Pre-op checklist templates

Anesthesia assessment form (structured)

Operative note (structured + narrative)

Post-op instruction template and medications

Follow-up plan builder:

schedule tasks at day offsets

define what patient must send (photo, symptom score, lab value)

define red flags and escalation rules

9.6 Messaging & WhatsApp integration

Must support:

Inbound messages via webhook

Outbound template management rules

Policy enforcement awareness (account health, violations)

Inbox requirements

Matched conversations (linked to patient)

Unmatched inbox:

show sender number, message preview, media

actions: link to existing patient / create new patient / ignore / escalate

Media handling

Download media securely

Store in object storage

Save metadata (hash, type, timestamp, source message id)

9.7 AI automation (human-in-the-loop)

Absolutely required safety rule: AI cannot write directly into “official chart.”

AI tasks:

classify message (admin question vs symptom vs lab report vs wound photo, etc.)

extract candidates (lab values, dates, symptoms, scores)

route to correct episode/task

Output:

Extraction Draft with confidence + evidence

Review Queue:

accept/edit/reject

On accept:

create structured Observation in the record with provenance “patient-submitted via WhatsApp”

Red-flag detection:

triggers escalation workflow (notify doctor, generate urgent task, optionally auto-reply with safety guidance)

9.8 Reporting & dashboards

Doctor dashboard:

pending reviews, red flags, overdue follow-ups

Reception dashboard:

today schedule, new inquiries, unmatched inbox

Episode dashboard:

patient adherence, missing checklist items

10) Data model (high-level entities)

Core objects you must implement (minimum):

Users / Roles / Permissions

Patients (UUID)

PatientIdentities (phone verification history)

ConsentRecords

Appointments

Encounters

Medications

LabOrders / LabResults

ImagingOrders / ImagingResults

Documents / MediaAssets

SurgicalEpisodes

PreOpChecklists / ChecklistItems

AnesthesiaAssessments

OperativeNotes / PostOpOrders

FollowUpPlans / FollowUpTasks

MessageThreads / Messages

PatientSubmissions

ExtractionDrafts

Observations (clinically accepted)

AuditLogs

NotificationLogs

11) Non-functional requirements (you’ll regret skipping these)
Security & privacy

Encryption at rest + in transit

Signed URLs for media access

Strict RBAC enforcement on every endpoint

Immutable audit log (append-only)

Reliability

WhatsApp downtime: queue + retry + backoff

Webhook idempotency (avoid duplicates)

Media ingestion retries

Performance

Patient search fast (< 300ms DB search on typical clinic size)

Timeline load < 2 seconds for typical patient histories

Maintainability

Modular monolith boundaries

Clear logging + monitoring

12) Integrations
WhatsApp Business Platform (MVP)

Webhooks for inbound messages/status

Template lifecycle (create/manage/approve)

Policy enforcement considerations

Future (v2/v3)

Payments

Lab providers

Imaging centers

EBM guideline content and CDS layer

13) MVP roadmap (phased to ship)
Phase 1 (foundation)

Auth/RBAC + audit logs

Patient registry + phone verification

Scheduling + reception dashboard

Documents upload + patient profile

Phase 2 (surgical episode)

Surgical episodes + checklists + anesthesia module

Follow-up plan templates + task scheduling

Phase 3 (WhatsApp + AI review)

Official WhatsApp webhooks + inboxes

Patient submissions + extraction drafts + review queue

Basic red-flag alerts

Phase 4 (mobile app)

Patient app for tasks/education uploads (still keep WhatsApp as channel)

Offline-friendly forms, better media capture

14) Acceptance criteria (what “done” means)

A new patient can be registered, phone verified, consent stored.

Appointment can be created, confirmed, and shown on calendar.

A surgical episode can be created with a pre-op checklist and follow-up plan.

Patient can send WhatsApp message/media → appears in system within 1 minute.

Unknown number goes to Unmatched Inbox (never lost).

AI draft extraction is generated and placed in Review Queue.

Clinician approval moves it into official chart with provenance and audit trail.

Red flag triggers doctor alert and flags the episode.

15) Risks & mitigations (don’t lie to yourself)

Wrong patient linkage (highest risk)

Mitigation: verified phone identity + unmatched inbox + manual linking + re-verification.

Unsafe automation (clinical harm risk)

Mitigation: human-in-the-loop, confidence thresholds, audit trails, escalation rules.

WhatsApp policy enforcement / template limitations

Mitigation: design around templates + opt-in + account health monitoring.

Scope creep (you’ll try to build Epic)

Mitigation: stick to MVP phases.

16) Open questions (you must decide early)

Episode-first UX vs Encounter-first UX: which is primary screen for doctor?

Patient portal in MVP or WhatsApp-only in MVP?

What procedures are in scope first (orthopedics? general surgery? vascular?), to define pathway templates accurately.

Who approves extracted data: doctor only, or trained assistant with doctor final sign-off?

Two blunt notes (so you don’t sabotage yourself)

If you insist on “AI automatically converts everything and adds to the database” you’re designing a data corruption machine. Human approval is not optional.

If you don’t build the Unmatched Inbox, your clinic will miss messages and your system will be blamed.

If you want the next step in the same “Blueprint” style, tell me and I’ll write (2) Design System and (3) Site Map + Wireframes (text-based) optimized for Cursor to generate consistent UI.