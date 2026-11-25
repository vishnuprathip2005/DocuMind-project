import io
import pytest
from app.services.retrieval import rank_documents, extract_snippet, get_query_terms


class MockDoc:
    def __init__(self, doc_id: str, original_name: str, extracted_text: str):
        self.id = doc_id
        self.original_name = original_name
        self.extracted_text = extracted_text


def test_retrieval_ranking_unit():
    doc1 = MockDoc("1", "leave_policy.txt", "Employees are entitled to 12 days of sick leave each year.")
    doc2 = MockDoc("2", "office_parking.txt", "Parking permits must be renewed annually by security.")
    doc3 = MockDoc("3", "benefits.txt", "Health insurance and paid vacation are provided to all full-time staff.")

    question = "How many sick leave days are allowed?"
    ranked = rank_documents([doc1, doc2, doc3], question)

    assert len(ranked) >= 1
    # doc1 has "sick" and "leave" -> should be top ranked
    assert ranked[0]["document"].id == "1"
    assert ranked[0]["score"] > 0
    # doc2 has no matching terms -> should not be included
    doc_ids = [r["document"].id for r in ranked]
    assert "2" not in doc_ids


def test_retrieval_snippet_extraction():
    text = "The company was founded in 2010. Security protocol requires multi-factor authentication for all logins. Employees must not share passwords."
    terms = ["security", "multi-factor"]
    snippet = extract_snippet(text, terms, max_chars=60)
    assert "Security protocol" in snippet or "multi-factor" in snippet


def test_chat_empty_question(client):
    resp1 = client.post("/api/chat", json={"question": ""})
    assert resp1.status_code == 422

    resp2 = client.post("/api/chat", json={"question": "   \n\t  "})
    assert resp2.status_code == 422


def test_chat_no_documents(client):
    response = client.post("/api/chat", json={"question": "What is the sick leave policy?"})
    assert response.status_code == 200
    data = response.json()
    assert "couldn't find" in data["answer"].lower()
    assert data["sources"] == []
    assert data["mode"] == "mock"


def test_chat_with_relevant_and_irrelevant_documents(client):
    # Upload relevant document
    client.post(
        "/api/documents",
        files={"file": ("sick_leave.txt", io.BytesIO(b"Company policy allows 15 days paid sick leave."), "text/plain")}
    )
    # Upload unrelated document
    client.post(
        "/api/documents",
        files={"file": ("cafeteria_menu.txt", io.BytesIO(b"Lunch is served daily between 12pm and 2pm."), "text/plain")}
    )

    # Ask relevant question
    resp = client.post("/api/chat", json={"question": "How many days of sick leave are granted?"})
    assert resp.status_code == 200
    data = resp.json()

    assert data["mode"] == "mock"
    assert len(data["sources"]) == 1
    assert data["sources"][0]["originalName"] == "sick_leave.txt"
    assert "15 days paid sick leave" in data["answer"] or "sick" in data["answer"].lower()


def test_chat_unrelated_query_returns_no_sources(client):
    client.post(
        "/api/documents",
        files={"file": ("guidelines.txt", io.BytesIO(b"Wear casual clothes on Friday."), "text/plain")}
    )

    resp = client.post("/api/chat", json={"question": "What is the astrophysics theory of dark matter?"})
    assert resp.status_code == 200
    data = resp.json()
    assert "couldn't find" in data["answer"].lower()
    assert data["sources"] == []
