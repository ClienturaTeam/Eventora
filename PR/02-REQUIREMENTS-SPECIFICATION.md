# 02 — Requirements Specification & User Stories

## 1. Functional Requirements (FR)

### FR-1: Real-Time Event Dashboard & Analytics
- **FR-1.1**: Platform Admins and Managers shall view real-time participant check-ins, registration counts, and evaluation progress.
- **FR-1.2**: Live leaderboards shall update automatically via WebSockets without page refreshes.
- **FR-1.3**: Historical metrics (Revenue trend, Organization growth, Monthly Event Counts) shall be generated via nightly background rollup aggregations.

### FR-2: Automated Certificate & Digital Credential Designer
- **FR-2.1**: Admins shall be able to design custom certificate templates using a visual drag-and-drop editor (Placeholders: `${PARTICIPANT_NAME}`, `${EVENT_NAME}`, `${DATE}`, `${QR_CODE}`).
- **FR-2.2**: The system shall generate batch PDF certificates asynchronously via BullMQ job queues.
- **FR-2.3**: Every issued certificate shall include a unique verification QR code leading to public verification endpoint `/certificates/verify/:code`.

### FR-3: Multi-Channel Communication Engine
- **FR-3.1**: Event managers shall be able to draft broadcast messages filtered by audience target (All Participants, Approved Teams, Judges, Volunteers).
- **FR-3.2**: The communication engine shall support multi-channel delivery: In-app notifications, Email (SendGrid/SES), and WhatsApp API.
- **FR-3.3**: Communication logs shall track delivery status (`PENDING`, `SENT`, `FAILED`, `READ`).

### FR-4: Advanced Hackathon Evaluation & Live Judging Matrix
- **FR-4.1**: Admins shall define custom multi-criteria scoring rubrics (e.g., Innovation: 30%, Technical Depth: 40%, Presentation: 30%).
- **FR-4.2**: Judges shall submit scores via a dedicated mobile-optimized scorecard UI with draft auto-saving.
- **FR-4.3**: Real-time score calibration algorithms shall normalize scores across different judge panels to eliminate judging bias.

### FR-5: AI Candidate Resume & Skill Matching Engine
- **FR-5.1**: Event sponsors and recruiters shall search hackathon participant profiles by verified skills, badge achievements, and project submissions.
- **FR-5.2**: AI matching algorithms shall recommend top candidates based on hackathon project quality and judge feedback.

---

## 2. Non-Functional Requirements (NFR)

### NFR-1: Performance & Latency SLAs
- **API Response Time**: P95 latency < 150ms for read requests, P99 latency < 300ms for write requests.
- **Real-Time Delivery**: WebSocket event propagation latency < 100ms.
- **PDF Generation**: Batch generation speed > 50 certificates per minute per worker node.

### NFR-2: Security & Zero-Trust Access
- **Authentication**: JWT token authentication with 15-minute access token lifespan and HTTP-only refresh tokens.
- **Authorization**: Granular RBAC middleware checking permissions at route and service layer (`requirePermission`).
- **Data Encryption**: Sensitive fields (tokens, connection strings) encrypted at rest using AES-256-GCM.
- **Rate Limiting**: API rate limiting enforced at 100 requests per minute per IP using Redis rate limiter.

### NFR-3: Scalability & Availability
- **Concurrent Users**: System must support up to 10,000 active concurrent WebSocket connections per cluster.
- **Uptime SLA**: 99.9% uptime target with automated failover for database and cache instances.

---

## 3. User Stories & Acceptance Criteria

### User Story 1: Event Manager Creating Custom Roles
> **As an** Organization Admin  
> **I want to** create a custom role with specific permissions (e.g., "Judge Lead" with `evaluations.manage` and `submissions.read`)  
> **So that** I can grant tailored access to staff without exposing global platform settings.

**Acceptance Criteria**:
1. Admin opens Role Management (`/roles`) and clicks "Create Custom Role".
2. Admin sees 10 categorized permission modules with live search filtering.
3. Admin selects exact permissions and clicks "Create Role".
4. The system updates the DB, invalidates query cache, and immediately displays the new role in User Creation dropdowns.

### User Story 2: Student Coordinator Generating AI Event Report
> **As a** Student Coordinator  
> **I want to** generate a structured final event report using verified event statistics and AI synthesis  
> **So that** I can submit a professional report to the Manager and Principal for approval.

**Acceptance Criteria**:
1. Coordinator fills event metrics and clicks "Generate AI Report".
2. Background worker synthesizes executive summary using Gemini/Ollama.
3. Report preview renders formatted executive summary, expenditure breakdown, and photo attachments.
4. Finalized report enters approval workflow (Faculty Coordinator -> Manager approval).
