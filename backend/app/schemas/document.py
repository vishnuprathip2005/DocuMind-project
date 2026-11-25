from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class DocumentMetadata(BaseModel):
    id: str
    original_name: str = Field(..., serialization_alias="originalName", validation_alias="originalName")
    content_type: str = Field(..., serialization_alias="contentType", validation_alias="contentType")
    size_bytes: int = Field(..., serialization_alias="sizeBytes", validation_alias="sizeBytes")
    uploaded_at: datetime = Field(..., serialization_alias="uploadedAt", validation_alias="uploadedAt")

    model_config = ConfigDict(
        populate_by_name=True,
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": "c9bf9e57-1685-4c89-bafb-ff5af830be8a",
                "originalName": "leave-policy.txt",
                "contentType": "text/plain",
                "sizeBytes": 1250,
                "uploadedAt": "2026-10-29T10:00:00Z"
            }
        }
    )


class DocumentDetail(DocumentMetadata):
    extracted_snippet: Optional[str] = Field(None, serialization_alias="extractedSnippet", validation_alias="extractedSnippet")
    extracted_text: Optional[str] = Field(None, serialization_alias="extractedText", validation_alias="extractedText")
