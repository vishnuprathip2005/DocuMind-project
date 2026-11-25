import json
from pathlib import Path
from typing import Any

SUPPORTED_EXTENSIONS = {".txt", ".md", ".json"}


def _flatten_json(data: Any, prefix: str = "") -> list[str]:
    """
    Recursively flattens structured JSON into searchable 'key: value' lines.
    """
    lines = []
    if isinstance(data, dict):
        for k, v in data.items():
            full_key = f"{prefix}.{k}" if prefix else str(k)
            lines.extend(_flatten_json(v, full_key))
    elif isinstance(data, list):
        for idx, item in enumerate(data):
            full_key = f"{prefix}[{idx}]" if prefix else f"item_{idx}"
            lines.extend(_flatten_json(item, full_key))
    else:
        val_str = str(data).strip()
        if prefix:
            lines.append(f"{prefix}: {val_str}")
        else:
            lines.append(val_str)
    return lines


def extract_text_from_bytes(file_bytes: bytes, filename: str) -> str:
    """
    Validates file extension and content, and extracts clean searchable text.
    Raises ValueError with descriptive message for invalid files.
    """
    if not file_bytes or len(file_bytes.strip()) == 0:
        raise ValueError("File is empty (0 bytes or whitespace only).")

    suffix = Path(filename).suffix.lower()
    if suffix not in SUPPORTED_EXTENSIONS:
        supported_str = ", ".join(sorted(SUPPORTED_EXTENSIONS))
        raise ValueError(f"Unsupported file format '{suffix}'. Supported formats are: {supported_str}")

    # Decode bytes to text
    decoded_text = ""
    for encoding in ("utf-8", "utf-8-sig", "latin-1"):
        try:
            decoded_text = file_bytes.decode(encoding)
            break
        except UnicodeDecodeError:
            continue

    if not decoded_text:
        raise ValueError("Unable to decode file content as readable text.")

    if suffix == ".json":
        try:
            parsed_data = json.loads(decoded_text)
        except json.JSONDecodeError as e:
            raise ValueError(f"Malformed JSON syntax: {e.msg} (line {e.lineno}, column {e.colno})")

        flattened_lines = _flatten_json(parsed_data)
        extracted = "\n".join(flattened_lines).strip()
        if not extracted:
            raise ValueError("JSON file contains no readable content.")
        return extracted

    # For .txt and .md
    stripped = decoded_text.strip()
    if not stripped:
        raise ValueError("File content is empty or contains only whitespace.")

    return stripped
