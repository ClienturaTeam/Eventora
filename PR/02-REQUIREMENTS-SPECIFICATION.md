# Eventora — Product Requirements & Real-World Specification

> **What is Eventora?**  
> Eventora is an end-to-end event operations and governance platform built specifically for universities, colleges, and tech communities. Instead of juggling scattered Google Forms, messy judging spreadsheets, WhatsApp announcements, and manual paper certificates, Eventora unifies the entire event lifecycle into a structured, transparent, and role-governed platform.

---

## 1. Why Eventora Exists (The Problem We Solved)

Running an institutional tech symposium or hackathon usually involves chaos:
* **The Approval Bottleneck**: Student coordinators print physical proposal forms, run between department offices for faculty budget sign-offs, and wait days for the Principal's stamp of approval.
* **Team Registration Mess**: Hackers sign up individually, swap teammates in private DMs, and leave organizers with outdated rosters on demo day.
* **Biased or Slow Judging**: Judges write scores on paper clipboards or unshared Excel sheets. Averaging takes hours, delaying the awards ceremony.
* **The Post-Event Reporting Nightmare**: Writing the post-hackathon completion report takes coordinators weeks of collecting photos, tracking expenses, and calculating turnout numbers.
* **Fake Certificates**: Paper certificates are easily forged, with no quick way for recruiters or university accreditation boards to verify authenticity.

**Eventora replaces this patchwork with a single, connected workflow.**

---

## 2. The 7-Step Institutional Event Lifecycle

Here is how an event actually moves through Eventora from a student's initial idea to the final archived dossier:

```
[01. Submit Proposal] 
       ↓
[02. Manager Review] 
       ↓
[03. Principal Sign-Off] 
       ↓
[04. Event & Track Setup] 
       ↓
[05. Coordinator Delegation] 
       ↓
[06. Live Execution & Scoring] 
       ↓
[07. AI Report & Archival]
```

### Step 01: Submit Proposal
* **Who does it**: Student Coordinator
* **What happens**: The coordinator drafts an event concept in the portal—detailing the proposed dates, estimated attendance, budget breakdown, venue needs (e.g. Main Auditorium), and key objectives.
* **Outcome**: A structured proposal is submitted directly to the Program Officer / Event Manager dashboard.

### Step 02: Manager Evaluation
* **Who does it**: Program Officer / Event Manager
* **What happens**: The manager reviews the proposal details, checks for scheduling conflicts with other college events, validates budget feasibility, and either requests adjustments or endorses it with recommendations.
* **Outcome**: The vetted proposal moves to the Principal's desk for executive sanction.

### Step 03: Principal Sign-off
* **Who does it**: Principal / Institutional Admin
* **What happens**: The administrative head reviews the endorsed proposal, gives formal administrative approval, allocates the campus venue/auditorium, and unlocks the event budget.
* **Outcome**: The event status changes from `PROPOSAL` to `APPROVED`, allowing the organizing team to launch public registrations.

### Step 04: Event & Track Setup
* **Who does it**: Event Manager & Lead Coordinators
* **What happens**: The team configures competition tracks (e.g., *AI & Machine Learning Track*, *Web3 & Fintech Track*), uploads problem statements, sets team size limits (2 to 5 members), onboards sponsors, and opens registration.
* **Outcome**: The event goes live on the public portal for hackers and attendees to discover.

### Step 05: Coordinator Delegation
* **Who does it**: Event Manager
* **What happens**: The manager assigns specific roles:
  * **Faculty Coordinators** to oversee academic compliance and mentor matching.
  * **Student Coordinators** to handle track operations, schedule logistics, and discord/chat updates.
  * **Judges** assigned to specific rubric tracks.
  * **Volunteers** granted mobile QR scanning privileges for gate check-ins.
* **Outcome**: Every team member gets a dashboard scoped strictly to what they need to see.

### Step 06: Live Execution & Scoring
* **Who does it**: Volunteers, Hackers, and Judges
* **What happens**:
  * **At the Gate**: Volunteers use their phones to scan attendees' unique QR passes. Check-in logs update in real time.
  * **At the Hacking Desks**: Teams submit their GitHub repository links, demo pitch video, and project slides before the countdown hits zero.
  * **In the Judging Room**: Judges open their digital scorecards on tablets or laptops, evaluate projects against standardized rubrics (Innovation, Tech Depth, Presentation), and submit scores.
* **Outcome**: Scores normalize automatically, generating the live leaderboard and podium standings.

### Step 07: AI Report & File Maintenance
* **Who does it**: Student Coordinator, Faculty, and Manager
* **What happens**:
  * The system pulls real event statistics (registrations, turnouts, track winners, budget spend).
  * **Gemini AI** synthesizes the official Executive Dossier—writing the executive summary, key takeaways, and recommendations.
  * Faculty and Managers review and apply their official digital stamp.
  * Cryptographic certificates with public QR codes are dispatched to all participants.
* **Outcome**: An official, print-ready PDF event dossier is archived and ready for university accreditation boards (NBA, NAAC, or management reviews).

---

## 3. Tailored Experiences for Every Role

Eventora uses clean, strict role-based access control. Users see only what they need to do their job without visual clutter:

| Role | Key Screen / URL | What They Actually Do |
|:---|:---|:---|
| **Student Coordinator** | `/coordinator` | Drafts event proposals, manages track logistics, tracks live registrations, and drafts the final AI event dossier. |
| **Event Manager** | `/manager` | Reviews proposals, configures judging rubrics, manages sponsor allocations, reviews reports, and signs off on winners. |
| **Principal / Admin** | `/platform-admin` | One-click formal approval for event proposals, institutional role management, audit log inspection, and security settings. |
| **Evaluator & Judge** | `/evaluations` | Inspects assigned team submissions, enters rubric scores with qualitative feedback, and finalizes scorecards. |
| **Participant / Hacker** | `/participant` | Discovers upcoming events, creates or joins hackathon teams, submits projects, tracks leaderboard ranks, and claims certificates. |
| **Mentor** | `/teams` | Holds virtual or in-person office hours, reviews early prototypes, and answers team questions. |
| **Volunteer** | `/attendance` | Scans attendee QR badges at event gates using their smartphone camera with instant visual feedback. |

---

## 4. Core Capabilities Explained Simply

### 4.1 Proposal & Multi-Tier Approvals
* No more lost paper forms. A student coordinator submits an event idea with target dates, expected turnout, and budget items.
* The Manager reviews and endorses it.
* The Principal has a dedicated clean screen with a simple **"Approve & Allocate Venue"** button or a request-for-revision note.

### 4.2 Hackathon Tracks & Team Dynamics
* Events aren't always one-size-fits-all. Eventora supports multiple competition tracks under a single hackathon.
* Hackers form teams with unique invitation links. Team leaders can invite members, accept join requests, and assign roles.
* Once the registration deadline passes or a project is submitted, team rosters lock automatically to prevent roster manipulation.

### 4.3 Digital Scorecards & Fair Judging
* Judges score on a clean, responsive mobile/tablet interface.
* Admins configure custom weighted rubrics (e.g. *Code Quality: 40%*, *Innovation: 30%*, *Viability: 30%*).
* Judges can save drafts while listening to pitches and hit "Finalize Score" when done.
* Once submitted, scores are locked. To prevent one harsh judge from skewing the results, the system normalizes scoring across panels.

### 4.4 Automated AI Event Dossiers (The Game Changer)
* Compiling a comprehensive post-event report usually takes weeks. In Eventora:
  1. The system gathers all verified data: number of hackers, total submissions, attendance percentage, winning teams, and timeline checkpoints.
  2. With one click, **Google Gemini AI** drafts a professional, publication-ready summary covering:
     * Executive Overview
     * Quantitative Highlights
     * Technical Breakthroughs & Project Highlights
     * Operational Challenges & Recommendations for next year
  3. The Student Coordinator reviews it, the Faculty Coordinator signs off, and the Manager applies the official institutional seal.
  4. Organizers download a print-ready, publication-quality PDF dossier complete with institutional branding, signatures, and timestamps.

### 4.5 Tamper-Proof Digital Certificates
* When winners and attendees are finalized, certificates are generated automatically.
* Every certificate includes:
  * Full Name, Event Name, Award Track, and Issue Date.
  * A unique cryptographic serial code (e.g., `CERT-AI-2026-98124`).
  * A scannable QR code linking to:
    ```
    https://eventora.edu/certificates/verify/:code
    ```
* Recruiters, employers, or university evaluators can scan the QR code from any phone and verify authenticity instantly—no login required.

### 4.6 Gate Attendance with QR Passports
* Every registered hacker receives a personal digital badge with an encrypted QR code.
* Volunteers stand at the entrance with their phones running Eventora's scanner screen.
* Each scan instantly flashes green with the attendee's name and photo, or red if already checked in or unapproved.
* Works even if campus Wi-Fi drops temporarily by syncing scans locally and reconciling when back online.

### 4.7 One-Click Operational Datasets (8 Master CSVs)
Event managers often need raw data for spreadsheets or institutional audits. Eventora provides instant CSV downloads for 8 dedicated modules:
1. **Events Master**: Schedule dates, registration fees, total revenues, and status.
2. **Competitions & Tracks**: Challenge descriptions, team capacities, and judge assignments.
3. **Participants Roster**: Names, college emails, team affiliations, and registration timestamps.
4. **Judge Scorecards**: Detailed score breakdown per criterion and judge comments.
5. **Attendance Logs**: Gate entry timestamps, session names, and check-in methods.
6. **Certificates Registry**: Issued credential serial numbers, types, and verification hashes.
7. **Winners & Podium**: Official rankings, cash prize allocations, and disbursement states.
8. **Broadcast Communications**: Sent announcements, delivery channels, and audience reach.

---

## 5. Non-Functional Guarantees (The Engine Under the Hood)

We designed Eventora to handle the reality of high-pressure college events:

* **Instant Responsiveness**:
  * Pages load in under 150 milliseconds.
  * Live leaderboards update via WebSockets in under 100 milliseconds—so when a judge hits submit, the screen updates without refreshing.
* **Bulletproof Multi-Tenancy**:
  * Different colleges or organizations run on the same platform, but their data is strictly isolated using tenant guards. College A cannot see College B's budgets or student records.
* **Campus Wi-Fi Resilience**:
  * Event gates have poor Wi-Fi. The volunteer scanner handles intermittent connectivity without dropping attendee records.
* **Enterprise Security**:
  * Zero plain-text passwords (hashed using bcrypt with cost factor 10).
  * High-security two-factor authentication (TOTP QR codes) for managers and administrators.
  * Immutable audit log tracking who did what, when, and from which IP address.
* **Clean, Human Design Aesthetic**:
  * No distracting rainbow gradients, no confusing neon badges.
  * Built with an executive dark-slate palette that feels like a modern SaaS platform (Linear, Vercel, Stripe).

---

## 6. Real-World User Scenarios

### Scenario A: Drafting and Approving the Annual Hackathon
1. **Alice (Student Coordinator)** logs into Eventora. She clicks *New Event Proposal*, enters "HackNova 2026", requests October 15–17, outlines an estimated budget of $4,500, and asks for the Engineering Auditorium.
2. **Prof. David (Event Manager)** gets an alert. He reviews Alice's proposal, notes that the dates don't clash with mid-term exams, approves the budget feasibility, and clicks *Endorse to Principal*.
3. **Dr. Sharma (Principal)** opens his dashboard on his iPad between meetings. He sees the proposal, notes the faculty endorsement, and clicks **"Approve & Allocate Venue"**.
4. Alice receives an instant notification: *"HackNova 2026 has been officially sanctioned!"* The event is ready for track setup.

### Scenario B: High-Stakes Demo Day Judging
1. **Team Quantum** presents their AI sign-language translation app to the judging panel.
2. **Elena (Industry Judge)** opens her iPad scorecard. She rates Innovation (28/30), Technical Depth (38/40), and Presentation (28/30), and types a note: *"Impressive real-time latency on Edge TPU."*
3. She taps **"Finalize Score"**. The system locks her evaluation to prevent tampering.
4. Out in the auditorium, the live leaderboard recalculates instantly. Team Quantum climbs into 1st place on the big projector screen.

### Scenario C: Sealing the Final Report with AI
1. The hackathon concludes on Sunday evening. Alice opens the Eventora Reports tab.
2. She clicks **"Generate AI Report"**. In seconds, Google Gemini reads the final turnout numbers, average scores, and winning team summaries, drafting a 4-page structured executive dossier.
3. Alice adds two photos of the podium ceremony and submits it to Prof. David.
4. Prof. David reviews the expenditure ledger, confirms the cash prizes, and signs off.
5. Alice downloads the finalized, sealed PDF dossier to submit to the university accreditation committee on Monday morning.

### Scenario D: A Hacker Shares Their Win on LinkedIn
1. **Rajat (Team Quantum Lead)** receives an email: *"Your HackNova 2026 Winner Certificate is Ready!"*
2. He opens his Eventora profile and downloads his high-resolution certificate.
3. He shares the public verification link on his LinkedIn profile:
   `https://eventora.edu/certificates/verify/CERT-HN26-10492`
4. A recruiter clicks the link and immediately sees a verified green badge from the university confirming Rajat took 1st place in the AI Track on October 17, 2026.

---

## 7. Feature-to-Database Traceability

| Real-World Feature | Primary Database Table(s) | Primary User Role |
|:---|:---|:---|
| **Event Proposals & Lifecycle** | `Event`, `HackathonProposal`, `EventRound` | Student Coordinator & Principal |
| **Multi-Track Competitions** | `Competition`, `ProblemStatement` | Event Manager |
| **Team Formation & Submissions** | `Team`, `TeamMember`, `Submission`, `SubmissionFile` | Participant / Hacker |
| **Live Scorecards & Rubrics** | `Judge`, `Evaluation`, `JudgeCompetition` | Evaluator & Judge |
| **Podium & Prize Ledger** | `Winner`, `Prize` | Event Manager |
| **AI Final Dossier** | `EventFinalReport`, `AIInsightsReport` | Student & Faculty Coordinator, Manager |
| **QR Digital Certificates** | `Certificate` | Participant & External Verifier |
| **Gate Attendance Scanning** | `AttendanceSession`, `AttendanceRecord` | Volunteer |
| **Broadcast Messaging** | `Communication`, `Notification` | Event Manager |
| **Audit Trails & Master CSVs** | `AuditLog`, `ReportsRepository` | Manager & Auditor |

---

*Authored by the Product & Architecture Team — Eventora Platform*  
*Last Updated: October 2026*
