import io
import os
import json
import uuid
from pathlib import Path
from app.core.config import settings


def test_list_empty_documents(client):
    response = client.get("/api/documents")
    assert response.status_code == 200
    assert response.json() == []


def test_upload_valid_txt(client):
    file_content = b"The annual sick leave allowance is 12 days."
    files = {"file": ("leave-policy.txt", io.BytesIO(file_content), "text/plain")}
    response = client.post("/api/documents", files=files)
    assert response.status_code == 201
    data = response.json()
    assert "id" in data
    assert data["originalName"] == "leave-policy.txt"
    assert data["contentType"] == "text/plain"
    assert data["sizeBytes"] == len(file_content)
    assert "uploadedAt" in data


def test_upload_valid_md(client):
    file_content = b"# Remote Work Policy\nEmployees may work remotely on Mondays and Fridays."
    files = {"file": ("remote_work.md", io.BytesIO(file_content), "text/markdown")}
    response = client.post("/api/documents", files=files)
    assert response.status_code == 201
    data = response.json()
    assert data["originalName"] == "remote_work.md"
    assert data["contentType"] == "text/markdown"
    assert data["sizeBytes"] == len(file_content)


def test_upload_valid_json(client):
    json_data = {"company": "Acme Corp", "benefits": {"health_insurance": "Full coverage", "vacation_days": 20}}
    file_content = json.dumps(json_data).encode("utf-8")
    files = {"file": ("benefits.json", io.BytesIO(file_content), "application/json")}
    response = client.post("/api/documents", files=files)
    assert response.status_code == 201
    data = response.json()
    assert data["originalName"] == "benefits.json"
    assert data["contentType"] == "application/json"


def test_upload_unsupported_extension(client):
    files = {"file": ("document.pdf", io.BytesIO(b"%PDF-1.4 mock pdf"), "application/pdf")}
    response = client.post("/api/documents", files=files)
    assert response.status_code == 400
    assert "Unsupported file format" in response.json()["detail"]


def test_upload_empty_file(client):
    files = {"file": ("empty.txt", io.BytesIO(b""), "text/plain")}
    response = client.post("/api/documents", files=files)
    assert response.status_code == 400
    assert "empty" in response.json()["detail"].lower()


def test_upload_oversized_file(client):
    # Temporarily set max size to 100 bytes for test
    orig_mb = settings.MAX_UPLOAD_SIZE_MB
    try:
        settings.MAX_UPLOAD_SIZE_MB = 1
        # Send 1.5 MB file
        large_bytes = b"X" * (int(1.5 * 1024 * 1024))
        files = {"file": ("large.txt", io.BytesIO(large_bytes), "text/plain")}
        response = client.post("/api/documents", files=files)
        assert response.status_code == 413
        assert "exceeds maximum allowed limit" in response.json()["detail"]
    finally:
        settings.MAX_UPLOAD_SIZE_MB = orig_mb


def test_upload_malformed_json(client):
    bad_json = b"{\"invalid\": json without quote}"
    files = {"file": ("broken.json", io.BytesIO(bad_json), "application/json")}
    response = client.post("/api/documents", files=files)
    assert response.status_code == 400
    assert "Malformed JSON" in response.json()["detail"]


def test_upload_missing_file_field(client):
    response = client.post("/api/documents", data={"other": "value"})
    assert response.status_code == 422


def test_list_documents_ordering(client):
    # Upload first
    client.post("/api/documents", files={"file": ("doc1.txt", io.BytesIO(b"Document 1 text"), "text/plain")})
    # Upload second
    client.post("/api/documents", files={"file": ("doc2.txt", io.BytesIO(b"Document 2 text"), "text/plain")})

    response = client.get("/api/documents")
    assert response.status_code == 200
    docs = response.json()
    assert len(docs) == 2
    # doc2 was uploaded after doc1, so doc2 should appear first
    assert docs[0]["originalName"] == "doc2.txt"
    assert docs[1]["originalName"] == "doc1.txt"


def test_get_document_by_id(client):
    upload_resp = client.post("/api/documents", files={"file": ("guide.txt", io.BytesIO(b"Guide text content"), "text/plain")})
    doc_id = upload_resp.json()["id"]

    get_resp = client.get(f"/api/documents/{doc_id}")
    assert get_resp.status_code == 200
    data = get_resp.json()
    assert data["id"] == doc_id
    assert data["originalName"] == "guide.txt"
    assert "extractedSnippet" in data


def test_get_document_invalid_and_missing_id(client):
    # Malformed ID
    resp_bad = client.get("/api/documents/not-a-valid-uuid")
    assert resp_bad.status_code == 400
    assert "Malformed document ID" in resp_bad.json()["detail"]

    # Missing ID
    random_uuid = str(uuid.uuid4())
    resp_missing = client.get(f"/api/documents/{random_uuid}")
    assert resp_missing.status_code == 404


def test_download_document(client):
    content = b"Content to be downloaded safely."
    upload_resp = client.post("/api/documents", files={"file": ("download_me.txt", io.BytesIO(content), "text/plain")})
    doc_id = upload_resp.json()["id"]

    dl_resp = client.get(f"/api/documents/{doc_id}/download")
    assert dl_resp.status_code == 200
    assert dl_resp.content == content
    assert 'filename="download_me.txt"' in dl_resp.headers.get("content-disposition", "")


def test_download_missing_or_malformed(client):
    resp_bad = client.get("/api/documents/bad-id/download")
    assert resp_bad.status_code == 400

    resp_missing = client.get(f"/api/documents/{uuid.uuid4()}/download")
    assert resp_missing.status_code == 404


def test_delete_document(client):
    upload_resp = client.post("/api/documents", files={"file": ("delete_me.txt", io.BytesIO(b"Delete me"), "text/plain")})
    doc_id = upload_resp.json()["id"]

    # Delete
    del_resp = client.delete(f"/api/documents/{doc_id}")
    assert del_resp.status_code == 204

    # Verify subsequent GET returns 404
    get_resp = client.get(f"/api/documents/{doc_id}")
    assert get_resp.status_code == 404

    # Verify download returns 404
    dl_resp = client.get(f"/api/documents/{doc_id}/download")
    assert dl_resp.status_code == 404

    # Verify list is empty
    list_resp = client.get("/api/documents")
    assert len(list_resp.json()) == 0


def test_delete_missing_or_malformed(client):
    resp_bad = client.delete("/api/documents/bad-id")
    assert resp_bad.status_code == 400

    resp_missing = client.delete(f"/api/documents/{uuid.uuid4()}")
    assert resp_missing.status_code == 404


def test_openapi_schema(client):
    response = client.get("/openapi.json")
    assert response.status_code == 200
    schema = response.json()
    assert "paths" in schema
    assert "/api/documents" in schema["paths"]
    assert "/api/chat" in schema["paths"]
    assert "/api/health" in schema["paths"]
