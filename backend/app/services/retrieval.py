import re
from typing import List, Dict, Any, Set

STOP_WORDS: Set[str] = {
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", 
    "aren't", "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", 
    "but", "by", "can", "cannot", "could", "couldn't", "did", "didn't", "do", "does", "doesn't", 
    "doing", "don't", "down", "during", "each", "few", "for", "from", "further", "had", "hadn't", 
    "has", "hasn't", "have", "haven't", "having", "he", "he'd", "he'll", "he's", "her", "here", 
    "here's", "hers", "herself", "him", "himself", "his", "how", "how's", "i", "i'd", "i'll", 
    "i'm", "i've", "if", "in", "into", "is", "isn't", "it", "it's", "its", "itself", "let's", 
    "me", "more", "most", "mustn't", "my", "myself", "no", "nor", "not", "of", "off", "on", 
    "once", "only", "or", "other", "ought", "our", "ours", "ourselves", "out", "over", "own", 
    "same", "shan't", "she", "she'd", "she'll", "she's", "should", "shouldn't", "so", "some", 
    "such", "than", "that", "that's", "the", "their", "theirs", "them", "themselves", "then", 
    "there", "there's", "these", "they", "they'd", "they'll", "they're", "they've", "this", 
    "those", "through", "to", "too", "under", "until", "up", "very", "was", "wasn't", "we", 
    "we'd", "we'll", "we're", "we've", "were", "weren't", "what", "what's", "when", "when's", 
    "where", "where's", "which", "while", "who", "who's", "whom", "why", "why's", "with", 
    "won't", "would", "wouldn't", "you", "you'd", "you'll", "you're", "you've", "your", "yours", 
    "yourself", "yourselves"
}

# Queries asking about the document itself (context, summary, overview, purpose, contents)
DOCUMENT_QUERY_PATTERNS = [
    r"\b(context|purpose|summary|summarize|overview|content|contents|structure|topic)\b",
    r"\b(what|tell|explain|describe|show)\b.*\b(in|about|of|inside)\b.*\b(document|file|upload|it|this|data)\b",
    r"\bwhat\b.*\b(stored|uploaded|put|have)\b",
    r"\b(document|file)\b.*\b(about|contain|have|mean|say)\b",
    r"\bwhat\s+(is|does)\s+this\s+(document|file|data)\b",
    r"^\s*what\s+is\s+the\s+context\b",
    r"^\s*(summarize|overview|explain\s+this|what\s+is\s+this)\b",
]

TOKEN_PATTERN = re.compile(r"\b\w+\b")


def is_document_query(question: str) -> bool:
    """Detects whether question is asking about the context, overview, or content of uploaded documents."""
    q = question.strip().lower()
    return any(re.search(pattern, q, re.IGNORECASE) for pattern in DOCUMENT_QUERY_PATTERNS)


def tokenize(text: str) -> List[str]:
    """Tokenize and case-fold string into words."""
    if not text:
        return []
    return [word.lower() for word in TOKEN_PATTERN.findall(text)]


def get_query_terms(question: str) -> List[str]:
    """Extract meaningful terms from question, filtering stop words unless all are stop words."""
    tokens = tokenize(question)
    meaningful = [t for t in tokens if t not in STOP_WORDS]
    return meaningful if meaningful else tokens


def extract_snippet(text: str, query_terms: List[str], max_chars: int = 500) -> str:
    """
    Extracts a representative window of text centered around matching query terms.
    """
    if not text:
        return ""
    if len(text) <= max_chars:
        return text.strip()

    lowered = text.lower()
    first_match_idx = -1
    for term in query_terms:
        idx = lowered.find(term)
        if idx != -1:
            if first_match_idx == -1 or idx < first_match_idx:
                first_match_idx = idx

    if first_match_idx == -1:
        return text[:max_chars].strip() + "..."

    half_window = max_chars // 2
    start = max(0, first_match_idx - half_window)
    end = min(len(text), start + max_chars)

    # Adjust boundary to word boundaries if possible
    if start > 0:
        prev_space = text.rfind(" ", 0, start)
        if prev_space != -1 and (start - prev_space) < 20:
            start = prev_space + 1
    if end < len(text):
        next_space = text.find(" ", end)
        if next_space != -1 and (next_space - end) < 20:
            end = next_space

    snippet = text[start:end].strip()
    prefix = "..." if start > 0 else ""
    suffix = "..." if end < len(text) else ""
    return f"{prefix}{snippet}{suffix}"


def rank_documents(documents: List[Any], question: str, max_results: int = 5) -> List[Dict[str, Any]]:
    """
    Ranks documents by query-term overlap or document-level context analysis.
    Returns list of dicts with document, score, and extracted snippet.
    """
    if not documents:
        return []

    # 1. Handle document-level inquiries ("what is the context of this document", "summarize", etc.)
    if is_document_query(question):
        results = []
        seen_names = set()
        for doc in documents:
            if doc.original_name in seen_names:
                continue
            seen_names.add(doc.original_name)

            content_snippet = doc.extracted_text[:1200].strip()
            if len(doc.extracted_text) > 1200:
                content_snippet += "..."

            results.append({
                "document": doc,
                "score": 1.0,
                "frequency": 1,
                "snippet": content_snippet,
                "matched_terms": ["document_context"],
                "is_overview": True,
            })
            if len(results) >= max_results:
                break
        return results

    # 2. Standard keyword overlap retrieval
    query_terms = get_query_terms(question)
    if not query_terms:
        return []

    unique_query_terms = set(query_terms)
    num_query_terms = len(unique_query_terms)
    results = []

    for doc in documents:
        # Search both original filename and extracted text
        searchable_text = f"{doc.original_name} {doc.extracted_text}"
        doc_tokens = tokenize(searchable_text)
        doc_token_set = set(doc_tokens)
        
        # Calculate matched terms
        matched_terms = unique_query_terms.intersection(doc_token_set)
        if not matched_terms:
            continue

        overlap_score = len(matched_terms) / num_query_terms
        frequency_count = sum(doc_tokens.count(term) for term in matched_terms)
        snippet = extract_snippet(doc.extracted_text, list(matched_terms))

        results.append({
            "document": doc,
            "score": overlap_score,
            "frequency": frequency_count,
            "snippet": snippet,
            "matched_terms": list(matched_terms),
            "is_overview": False,
        })

    # Sort descending by overlap score, then frequency, then stable ID ascending
    results.sort(
        key=lambda item: (item["score"], item["frequency"], -ord(item["document"].id[0]) if item["document"].id else 0),
        reverse=True
    )

    return results[:max_results]
