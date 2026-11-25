from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.db.models import Document
from app.db.session import get_db
from app.schemas.chat import ChatRequest, ChatResponse, SourceItem
from app.services.retrieval import rank_documents, is_document_query
from app.services.ai_provider import generate_answer

router = APIRouter(prefix="/api/chat", tags=["AI Chat"])


@router.post(
    "",
    response_model=ChatResponse,
    status_code=status.HTTP_200_OK,
    summary="Ask a question about uploaded documents",
    description="Searches extracted document text using keyword overlap and returns an AI or mock grounded response with source citations."
)
async def chat(request: ChatRequest, db: Session = Depends(get_db)):
    # 1. Fetch all documents from the database
    documents = db.query(Document).all()

    if not documents:
        return ChatResponse(
            answer="I couldn't find this in the uploaded documents.",
            sources=[],
            mode="mock"
        )

    # 2. Perform keyword overlap retrieval
    ranked_results = rank_documents(documents, request.question, max_results=5)

    # 3. Context & Document Query Fallback:
    # If literal overlap is empty but the user is asking about the document or its context/summary/contents:
    if not ranked_results and is_document_query(request.question):
        ranked_results = []
        for doc in documents[:3]:
            ranked_results.append({
                "document": doc,
                "score": 1.0,
                "frequency": 1,
                "snippet": doc.extracted_text[:1200].strip(),
                "matched_terms": ["document_context"],
                "is_overview": True,
            })

    if not ranked_results:
        return ChatResponse(
            answer="I couldn't find this in the uploaded documents.",
            sources=[],
            mode="mock"
        )

    # 3. Deduplicate and collect source documents in rank order
    seen_ids = set()
    sources: List[SourceItem] = []
    for item in ranked_results:
        doc = item["document"]
        if doc.id not in seen_ids:
            seen_ids.add(doc.id)
            sources.append(SourceItem(id=doc.id, originalName=doc.original_name))

    # 4. Generate grounded answer
    answer, mode = await generate_answer(request.question, ranked_results)

    return ChatResponse(
        answer=answer,
        sources=sources,
        mode=mode
    )
