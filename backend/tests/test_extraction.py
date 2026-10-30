from io import BytesIO

import pymupdf
import pytest
from docx import Document

from backend.app.services.extraction import ResumeExtractionError, extract_resume


def test_extract_pdf_text():
    pdf = pymupdf.open()
    page = pdf.new_page()
    page.insert_text((72, 72), "Jordan Lee\nPython and data analysis")
    content = pdf.tobytes()
    pdf.close()
    assert "Python and data analysis" in extract_resume("resume.pdf", content)


def test_extract_docx_text():
    document = Document()
    document.add_paragraph("Jordan Lee")
    document.add_paragraph("Education: Bachelor of Science")
    stream = BytesIO()
    document.save(stream)
    assert "Bachelor of Science" in extract_resume("resume.docx", stream.getvalue())


@pytest.mark.parametrize(
    ("filename", "content", "message"),
    [
        ("resume.txt", b"resume", "Only PDF and DOCX"),
        ("resume.pdf", b"not a pdf", "valid PDF signature"),
        ("resume.docx", b"not a package", "valid DOCX signature"),
        ("resume.pdf", b"%PDF-1.4", "could not be read"),
    ],
)
def test_reject_invalid_documents(filename, content, message):
    with pytest.raises(ResumeExtractionError, match=message):
        extract_resume(filename, content)


def test_reject_empty_document():
    document = Document()
    stream = BytesIO()
    document.save(stream)
    with pytest.raises(ResumeExtractionError, match="No readable text"):
        extract_resume("empty.docx", stream.getvalue())
