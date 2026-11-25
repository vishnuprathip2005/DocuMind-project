import uuid
from typing import List
from pathlib import Path
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse, Response
from sqlalchemy.orm import Session
from app.core.config import settings
from app.db.models import Document
from app.db.session import get_db
from app.schemas.document import DocumentMetadata, DocumentDetail
from app.services.file_storage import save_file, delete_file, verify_file_exists
from app.services.text_extraction import extract_text_from_bytes, SUPPORTED_EXTENSIONS

router = APIRouter(prefix="/api/documents", tags=["Documents"])


def validate_uuid(id_str: str) -> str:
    """Validates that id_str is a valid UUID string, returning 400 if malformed."""
    try:
        val = uuid.UUID(id_str)
        return str(val)
    except (ValueError, AttributeError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Malformed document ID '{id_str}'. Must be a valid UUID."
        )


@router.post(
    "",
    response_model=DocumentMetadata,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a new document",
    description="Upload a .txt, .md, or .json document. Content is extracted and stored."
)
async def upload_document(
    file: UploadFile = File(..., description="The document file to upload (.txt, .md, .json)"),
    db: Session = Depends(get_db)
):
    if not file or not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No file was provided in the upload request."
        )

    filename = file.filename
    ext = Path(filename).suffix.lower()
    if ext not in SUPPORTED_EXTENSIONS:
        supported_list = ", ".join(sorted(SUPPORTED_EXTENSIONS))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{ext}'. Allowed formats: {supported_list}"
        )

    # Read bytes and check size limit
    try:
        content_bytes = await file.read()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to read uploaded file: {str(e)}"
        )

    if not content_bytes or len(content_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty (0 bytes)."
        )

    if len(content_bytes) > settings.max_upload_size_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_CONTENT_TOO_LARGE,
            detail=f"File size exceeds maximum allowed limit of {settings.MAX_UPLOAD_SIZE_MB}MB."
        )

    # Extract text from file
    try:
        extracted_text = extract_text_from_bytes(content_bytes, filename)
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err)
        )

    # Save file to storage
    try:
        storage_path, _ = save_file(content_bytes, filename)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Storage failure occurred while saving the file."
        )

    # Persist in Database
    doc_id = str(uuid.uuid4())
    content_type = file.content_type or "text/plain"
    if ext == ".json":
        content_type = "application/json"
    elif ext == ".md":
        content_type = "text/markdown"

    doc = Document(
        id=doc_id,
        original_name=filename,
        content_type=content_type,
        size_bytes=len(content_bytes),
        storage_path=storage_path,
        extracted_text=extracted_text,
    )

    try:
        db.add(doc)
        db.commit()
        db.refresh(doc)
    except Exception as e:
        db.rollback()
        delete_file(storage_path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database persistence error while saving document record."
        )

    return doc


@router.get(
    "",
    response_model=List[DocumentMetadata],
    status_code=status.HTTP_200_OK,
    summary="List all documents",
    description="Returns metadata for all documents ordered by uploadedAt descending."
)
def list_documents(db: Session = Depends(get_db)):
    documents = (
        db.query(Document)
        .order_by(Document.uploaded_at.desc(), Document.id.asc())
        .all()
    )
    return documents


@router.get(
    "/{id}",
    response_model=DocumentDetail,
    status_code=status.HTTP_200_OK,
    summary="Get document details",
    description="Retrieve metadata and preview snippet for a specific document by ID."
)
def get_document(id: str, db: Session = Depends(get_db)):
    valid_id = validate_uuid(id)
    doc = db.query(Document).filter(Document.id == valid_id).first()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document with ID '{id}' was not found."
        )

    # Return full extracted text and snippet
    snippet = doc.extracted_text[:1000] if doc.extracted_text else ""
    return DocumentDetail(
        id=doc.id,
        originalName=doc.original_name,
        contentType=doc.content_type,
        sizeBytes=doc.size_bytes,
        uploadedAt=doc.uploaded_at,
        extractedSnippet=snippet,
        extractedText=doc.extracted_text or ""
    )


@router.get(
    "/{id}/view",
    status_code=status.HTTP_200_OK,
    summary="View document inline in browser",
    description="Opens the original file inline in the browser tab with correct Content-Type."
)
def view_document_inline(id: str, db: Session = Depends(get_db)):
    valid_id = validate_uuid(id)
    doc = db.query(Document).filter(Document.id == valid_id).first()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document with ID '{id}' was not found."
        )

    if not verify_file_exists(doc.storage_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Stored physical file is missing or inaccessible on server."
        )

    media_type = doc.content_type or "text/plain"
    if "text" in media_type or doc.original_name.endswith((".txt", ".md", ".json")):
        if "charset" not in media_type:
            media_type = f"{media_type}; charset=utf-8"

    return FileResponse(
        path=doc.storage_path,
        filename=doc.original_name,
        media_type=media_type,
        content_disposition_type="inline"
    )


@router.get(
    "/{id}/download",
    status_code=status.HTTP_200_OK,
    summary="Download original document",
    description="Downloads the original file bytes with Content-Disposition attachment."
)
def download_document(id: str, db: Session = Depends(get_db)):
    valid_id = validate_uuid(id)
    doc = db.query(Document).filter(Document.id == valid_id).first()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document with ID '{id}' was not found."
        )

    if not verify_file_exists(doc.storage_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Stored physical file is missing or inaccessible on server."
        )

    return FileResponse(
        path=doc.storage_path,
        filename=doc.original_name,
        media_type=doc.content_type
    )


@router.delete(
    "/{id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a document",
    description="Removes document from database and deletes its physical file from storage."
)
def delete_document(id: str, db: Session = Depends(get_db)):
    valid_id = validate_uuid(id)
    doc = db.query(Document).filter(Document.id == valid_id).first()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document with ID '{id}' was not found."
        )

    storage_path = doc.storage_path
    db.delete(doc)
    db.commit()

    # Clean up physical storage file safely
    delete_file(storage_path)

    return Response(status_code=status.HTTP_204_NO_CONTENT)
