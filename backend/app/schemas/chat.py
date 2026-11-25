from typing import List, Literal
from pydantic import BaseModel, ConfigDict, Field, field_validator


class ChatRequest(BaseModel):
    question: str

    @field_validator("question")
    @classmethod
    def validate_question(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Question cannot be empty or contain only whitespace.")
        return v.strip()

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "question": "How many days of sick leave are allowed?"
            }
        }
    )


class SourceItem(BaseModel):
    id: str
    original_name: str = Field(..., serialization_alias="originalName", validation_alias="originalName")

    model_config = ConfigDict(
        populate_by_name=True,
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": "c9bf9e57-1685-4c89-bafb-ff5af830be8a",
                "originalName": "leave-policy.txt"
            }
        }
    )


class ChatResponse(BaseModel):
    answer: str
    sources: List[SourceItem] = Field(default_factory=list)
    mode: Literal["llm", "mock"] = "mock"

    model_config = ConfigDict(
        populate_by_name=True,
        json_schema_extra={
            "example": {
                "answer": "The uploaded leave policy says that 12 days of sick leave are allowed annually.",
                "sources": [
                    {
                        "id": "c9bf9e57-1685-4c89-bafb-ff5af830be8a",
                        "originalName": "leave-policy.txt"
                    }
                ],
                "mode": "mock"
            }
        }
    )
