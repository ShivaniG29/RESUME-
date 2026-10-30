from io import BytesIO
from zipfile import BadZipFile, ZipFile

import pymupdf
from docx import Document
from docx.opc.exceptions import PackageNotFoundError
from lxml.etree import XMLSyntaxError

MAX_EXTRACTED_CHARACTERS = 100_000
MAX_DOCX_UNCOMPRESSED_BYTES = 25 * 1024 * 1024
MAX_DOCX_ENTRIES = 1_000


class ResumeExtractionError(ValueError):
    pass


def extract_resume(filename: str, content: bytes) -> str:
    suffix = filename.lower().rsplit(".", 1)[-1] if "." in filename else ""
    try:
        if suffix == "pdf":
            if not content.startswith(b"%PDF-"):
                raise ResumeExtractionError("The file does not have a valid PDF signature.")
            with pymupdf.open(stream=content, filetype="pdf") as document:
                if document.is_encrypted:
                    raise ResumeExtractionError("Password-protected PDFs are not supported.")
                if document.page_count > 100:
                    raise ResumeExtractionError("The PDF exceeds the 100-page limit.")
                text = "\n".join(page.get_text() for page in document)
        elif suffix == "docx":
            if not content.startswith(b"PK"):
                raise ResumeExtractionError("The file does not have a valid DOCX signature.")
            with ZipFile(BytesIO(content)) as archive:
                names = archive.namelist()
                if (
                    "word/document.xml" not in names
                    or len(names) > MAX_DOCX_ENTRIES
                    or sum(item.file_size for item in archive.infolist()) > MAX_DOCX_UNCOMPRESSED_BYTES
                ):
                    raise ResumeExtractionError("The DOCX package is invalid or exceeds safe processing limits.")
            document = Document(BytesIO(content))
            paragraphs = [paragraph.text for paragraph in document.paragraphs]
            paragraphs.extend(
                cell.text
                for table in document.tables
                for row in table.rows
                for cell in row.cells
            )
            text = "\n".join(paragraphs)
        else:
            raise ResumeExtractionError("Only PDF and DOCX resumes are supported.")
    except ResumeExtractionError:
        raise
    except (pymupdf.FileDataError, BadZipFile, KeyError, ValueError, PackageNotFoundError, XMLSyntaxError) as error:
        raise ResumeExtractionError("The document could not be read. Check that it is a valid PDF or DOCX.") from error

    text = text.replace("\x00", "").strip()
    if not text:
        raise ResumeExtractionError("No readable text was found in the document.")
    if len(text) > MAX_EXTRACTED_CHARACTERS:
        raise ResumeExtractionError("The extracted text exceeds the 100,000 character limit.")
    return text
