# Resume Analyzer

A college placement-cell resume analysis application. Students upload a PDF or DOCX, review a structured report, and can request AI feedback only after explicitly consenting to send resume text to OpenAI. Without an API key, the application uses a transparent, local heuristic analyzer.

## Architecture

- `frontend/`: React, Vite, React Router, Axios, Recharts, and Tailwind CSS.
- `backend/app/`: FastAPI routes, Pydantic response validation, SQLAlchemy models, authentication, extraction, and analysis services.
- `backend/tests/`: API, extraction, validation, and persistence tests.
- SQLite stores user accounts, extracted resume text, and analysis reports. Original uploaded files are processed in memory and are not persisted.
- JWT bearer tokens protect user-specific resume and analysis endpoints. Passwords are hashed with Argon2.

## Run locally

Requirements: Python 3.10+ and Node.js 18+.

1. Copy `.env.example` to `.env`. Set a long, unique `JWT_SECRET_KEY`; optionally configure `OPENAI_API_KEY` and `OPENAI_MODEL`. No API key is needed for local demo mode.
2. Install backend requirements and start the API from the repository root:

   ```powershell
   python -m venv .venv
   .venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   uvicorn backend.app.main:app --reload
   ```

3. In a second terminal:

   ```powershell
   cd frontend
   npm install
   npm run dev
   ```

4. Open the Vite URL (normally `http://localhost:5173`), create an account, and upload a resume. API documentation is available at `http://127.0.0.1:8000/docs`.

The frontend expects the API at `http://127.0.0.1:8000`; override it with `VITE_API_URL` if needed. Configure `CORS_ORIGINS` as a comma-separated list when hosting the frontend elsewhere.

## Privacy and security

- Resume files are validated by extension, content signature, and parser; maximum upload size is 5 MiB. Extracted text and reports remain in the local SQLite database until deleted.
- The analyzer never sends resume text outside the application unless the user checks the explicit AI-processing consent box for that analysis.
- With no configured OpenAI key, analysis runs locally and is labeled demo analysis. If the AI provider fails after consent, a local analysis is returned with its mode clearly identified.
- Resume text is never included in application logs. Do not expose the development server or SQLite database publicly; use HTTPS, a managed database, backups, and a production secret manager before deployment.
- The score is an explainable heuristic, not a hiring decision and not a guarantee of ATS success. Suggested roles are career matches, not job vacancies.

## API

All endpoints are prefixed with `/api`.

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | Liveness check |
| POST | `/auth/register` | Create an account |
| POST | `/auth/login` | Authenticate and return a JWT |
| GET | `/auth/me` | Return the authenticated account |
| POST | `/resume/upload` | Validate and extract a PDF/DOCX |
| POST | `/resume/analyze` | Analyze an owned resume (`resume_id`, `ai_consent`) |
| GET | `/resume/history` | List the current user's reports |
| GET | `/resume/{id}` | Retrieve an owned resume and latest report |
| DELETE | `/resume/{id}` | Delete an owned resume and reports |

Interactive API reference: `/docs`; ReDoc: `/redoc`.
The phase-one user stories, system boundaries, data model, and UI/API design are in [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md); endpoint request examples and error codes are in [docs/API.md](./docs/API.md).

## Testing

From the repository root:

```powershell
pytest backend/tests
```

Frontend:

```powershell
cd frontend
npm test
npm run build
```

## Scope and limitations

This is a single-user-per-account demonstration application, not an institutional placement-management platform. It does not include administrator/student provisioning, job-board integration, or claims about real openings. Users should verify learning resources and role requirements independently.
