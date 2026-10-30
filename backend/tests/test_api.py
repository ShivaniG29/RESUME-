from io import BytesIO

import pymupdf
from docx import Document


def make_docx():
    document = Document()
    document.add_paragraph("Jordan Lee")
    document.add_paragraph("Education")
    document.add_paragraph("Bachelor of Science in Computer Science")
    document.add_paragraph("Skills")
    document.add_paragraph("Python, SQL, React, Git, Docker")
    document.add_paragraph("Experience")
    document.add_paragraph("Developed data tools with Python and SQL.")
    stream = BytesIO()
    document.save(stream)
    return stream.getvalue()


def test_health(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_authentication_and_password_hashing(client, account):
    assert client.get("/api/auth/me").status_code == 401
    assert client.get("/api/auth/me", headers={"Authorization": f"Bearer {account['access_token']}"}).json()["email"] == "taylor@example.edu"
    login = client.post("/api/auth/login", json={"email": "TAYLOR@example.edu", "password": "long-test-password"})
    assert login.status_code == 200
    assert login.json()["user"]["name"] == "Taylor Student"
    assert client.post("/api/auth/login", json={"email": "taylor@example.edu", "password": "wrong-password"}).status_code == 401
    assert client.post("/api/auth/register", json={"name": "Other", "email": "taylor@example.edu", "password": "long-test-password"}).status_code == 409


def test_upload_analyze_history_detail_and_delete(client, auth_headers):
    uploaded = client.post(
        "/api/resume/upload",
        headers=auth_headers,
        files={"file": ("jordan.docx", make_docx(), "application/vnd.openxmlformats-officedocument.wordprocessingml.document")},
    )
    assert uploaded.status_code == 201
    resume_id = uploaded.json()["id"]

    result = client.post("/api/resume/analyze", headers=auth_headers, json={"resume_id": resume_id})
    assert result.status_code == 200
    assert result.json()["analysis_mode"] == "demo_local"
    assert result.json()["report"]["score_breakdown"]["total"] in range(101)
    assert result.json()["report"]["programming_languages"] == ["Python", "SQL"]

    history = client.get("/api/resume/history", headers=auth_headers)
    assert history.status_code == 200
    assert len(history.json()) == 1
    assert history.json()[0]["filename"] == "jordan.docx"
    assert "Software Engineer" in history.json()[0]["suggested_roles"]
    detail = client.get(f"/api/resume/{resume_id}", headers=auth_headers)
    assert detail.status_code == 200
    assert detail.json()["latest_analysis"]["report"]["summary"]

    deleted = client.delete(f"/api/resume/{resume_id}", headers=auth_headers)
    assert deleted.status_code == 204
    assert client.get("/api/resume/history", headers=auth_headers).json() == []
    assert client.get(f"/api/resume/{resume_id}", headers=auth_headers).status_code == 404


def test_upload_pdf(client, auth_headers):
    pdf = pymupdf.open()
    pdf.new_page().insert_text((72, 72), "Resume content Python")
    response = client.post(
        "/api/resume/upload",
        headers=auth_headers,
        files={"file": ("resume.pdf", pdf.tobytes(), "application/pdf")},
    )
    pdf.close()
    assert response.status_code == 201


def test_reject_invalid_file_type_and_oversized_file(client, auth_headers):
    invalid = client.post(
        "/api/resume/upload",
        headers=auth_headers,
        files={"file": ("resume.txt", b"resume", "text/plain")},
    )
    assert invalid.status_code == 415
    oversized = client.post(
        "/api/resume/upload",
        headers=auth_headers,
        files={"file": ("resume.pdf", b"%PDF-" + b"x" * (5 * 1024 * 1024), "application/pdf")},
    )
    assert oversized.status_code == 413


def test_user_cannot_read_or_analyze_another_users_resume(client, auth_headers):
    uploaded = client.post(
        "/api/resume/upload",
        headers=auth_headers,
        files={"file": ("jordan.docx", make_docx(), "application/vnd.openxmlformats-officedocument.wordprocessingml.document")},
    )
    resume_id = uploaded.json()["id"]
    other = client.post(
        "/api/auth/register",
        json={"name": "Morgan Student", "email": "morgan@example.edu", "password": "another-long-password"},
    )
    other_headers = {"Authorization": f"Bearer {other.json()['access_token']}"}
    assert client.get(f"/api/resume/{resume_id}", headers=other_headers).status_code == 404
    assert client.post("/api/resume/analyze", headers=other_headers, json={"resume_id": resume_id}).status_code == 404


def test_requires_authentication_for_resume_upload(client):
    response = client.post("/api/resume/upload", files={"file": ("resume.docx", make_docx())})
    assert response.status_code == 401
