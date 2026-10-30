# Requirements and system architecture

## Product scope

The application gives students private, evidence-based resume feedback and helps them identify skill-building opportunities. Suggested career roles are directional matches, never represented as live vacancies. The score is a transparent guide rather than a hiring or ATS-success prediction.

### User stories

- As a student, I can register and sign in so that my resume history is accessible only to my account.
- As a student, I can upload a PDF or DOCX and see a clear validation error for unsupported, unreadable, or oversized files.
- As a student, I can review a structured summary, skills, suggested career matches, skill gaps, learning ideas, resume feedback, and an explainable score.
- As a student, I can choose private local analysis or explicitly consent to sending extracted resume text to the configured AI provider for one analysis.
- As a student, I can revisit reports, compare previous scores, and permanently delete a resume and its reports.
- As a placement-cell demonstrator, I can run the system without an AI key and show analysis based on the student's actual resume text.

### Functional and non-functional requirements

| Area | Requirement |
|---|---|
| Upload | Accept PDF/DOCX up to 5 MiB; check extension, file signature, parser validity, page/package limits, and non-empty extracted text. |
| Analysis | Validate structured output; identify skills and suggested roles; derive learning and resume-improvement suggestions; explain score components. |
| Privacy | Do not call an external AI service without per-analysis consent. Never log resume text. Do not retain original upload files. |
| Identity | Hash passwords; require bearer authentication for resume operations; scope every read, analysis, and delete to the authenticated user. |
| Reliability | On missing AI credentials, use local analysis. On AI service or response-validation failure, return a clearly labeled local fallback. |
| Experience | Responsive dashboard, accessible upload controls, history, charts, progress, loading, and visible error states. |
| Operations | Configure secrets and CORS using environment variables; serve OpenAPI docs; exclude secrets, databases, and uploads from Git. |

## Architecture

```text
React/Vite browser client
    | Axios + JWT bearer token
    v
FastAPI (/api)
    |-- Auth: Argon2 password hashing and signed JWT
    |-- Upload: signature/size checks -> PDF/DOCX extraction in memory
    |-- Analyzer: local rules OR consented OpenAI request -> Pydantic validation
    |-- SQLAlchemy ORM
    v
SQLite: users, extracted resumes, structured analysis reports
```

The browser stores only the short-lived access token in local storage. The database stores extracted resume text so users can request and revisit analyses; original files are never written to disk. A deletion removes the resume text and its associated analysis reports. SQLite is appropriate for local demonstration, not concurrent public deployment.

### Data model

- `User`: integer ID, display name, unique normalized email, Argon2 password hash, creation time.
- `Resume`: integer ID, owning user ID, original filename, extracted text, upload time.
- `Analysis`: integer ID, resume ID, score, validated JSON report, analysis mode, creation time.

Resume ownership is checked in every resource route. Resume-to-analysis and user-to-resume relationships cascade on deletion.

### Analysis and score

The AI response is parsed against the same Pydantic report schema used by the API. Resume text is treated as untrusted input in the prompt. The API recomputes the weighted total from five 0–100 components: skills relevance (30%), structure (20%), experience presentation (20%), education (15%), and ATS readability (15%). The local fallback extracts only recognized skills and explicit text sections, and uses conservative, non-claiming suggestions when evidence is absent.

### Frontend page map

| Route | Purpose |
|---|---|
| `/` | Landing page and account sign-in/registration |
| `/dashboard` | Review counts, average score, career matches, and recent activity |
| `/upload` | PDF/DOCX selection, consent, upload progress, and analysis |
| `/analysis/:id` | Summary, education, experience, certifications, achievements, score, and improvements |
| `/analysis/:id/skills` | Skill categories and visualization |
| `/analysis/:id/jobs` | Suggested career matches and skills gaps |
| `/analysis/:id/learning` | Learning topics, levels, and resources |
| `/history` | Prior analyses, score comparison, report navigation, and deletion |

## Delivery phases

1. **Requirements and architecture:** scope, user stories, API/data boundaries, privacy constraints, and page map are documented here.
2. **System design:** REST contracts are in `API.md`; SQLAlchemy/Pydantic models encode database and response schemas; responsive page structure is defined in the frontend.
3. **Implementation:** authentication, extraction, consent-aware analyzer, persistence, REST endpoints, and client flows are implemented.
4. **Review and safety:** user-scoped queries, upload limits/signatures, error paths, password hashing, consent checks, and data deletion are covered by implementation and tests.
5. **Testing:** backend unit/integration tests cover authentication, extraction, uploads, AI response validation/fallback, report persistence, and user isolation. The frontend includes a focused component test.
6. **Documentation and Git:** setup, privacy, limitations, and API contracts are described in the README and `docs/`.
