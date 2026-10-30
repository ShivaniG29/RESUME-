# Resume Analyzer API

Base URL: `http://127.0.0.1:8000/api` in local development. Interactive OpenAPI docs: `http://127.0.0.1:8000/docs`.

All requests and responses use JSON except `POST /resume/upload`, which uses `multipart/form-data`. Protected endpoints require `Authorization: Bearer <access_token>`.

## Authentication

### `POST /auth/register`

```json
{ "name": "Taylor Student", "email": "taylor@example.edu", "password": "at-least-10-characters" }
```

Returns an access token and public user profile. Email addresses are case-insensitive. Passwords are stored as Argon2 hashes.

### `POST /auth/login`

```json
{ "email": "taylor@example.edu", "password": "at-least-10-characters" }
```

Returns the same token envelope as registration. `GET /auth/me` returns the authenticated profile.

## Resume processing

### `POST /resume/upload`

Authenticated `multipart/form-data` field `file`, with a PDF or DOCX up to 5 MiB. The server verifies the file signature, parses text in memory, and stores only the extracted text. Response:

```json
{ "id": 1, "filename": "resume.pdf", "uploaded_at": "2026-01-01T00:00:00Z" }
```

### `POST /resume/analyze`

```json
{ "resume_id": 1, "ai_consent": false }
```

`ai_consent` defaults to `false`. Only when it is `true` and an API key is configured will extracted resume text be sent to OpenAI. Without consent or a configured key, analysis runs locally. Provider/validation errors fall back to local analysis and are identified by `analysis_mode` (`demo_local`, `openai`, or `local_fallback`).

The validated `report` contains a candidate summary, education/experience highlights, skill categories, suggested career matches, missing skills, learning suggestions, resume-improvement suggestions, and an explainable 0–100 score breakdown. Job recommendations are not live listings.

### `GET /resume/history`

Returns up to 100 newest analysis records belonging to the authenticated user. Each item includes its resume filename, score, analysis mode, and suggested role titles.

### `GET /resume/{id}`

Returns the requested owned resume and its latest report, or 404 when it does not exist or belongs to another account.

### `DELETE /resume/{id}`

Deletes the owned resume, extracted text, and all its analysis records. Returns `204 No Content`.

### `GET /health`

Unauthenticated liveness check returning `{"status":"ok"}`.

## Error responses

Errors use FastAPI's JSON `detail` format. Common status codes: `401` missing/invalid authentication, `404` resource absent or not owned, `409` duplicate email, `413` file too large, `415` unsupported file extension, and `422` invalid request/document content.
