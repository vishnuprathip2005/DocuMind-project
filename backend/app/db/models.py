from datetime import datetime, timezone
import uuid
from sqlalchemy import Column, String, Integer, DateTime, Text
from sqlalchemy.orm import declarative_base

Base = declarative_base()


def utc_now():
    return datetime.now(timezone.utc)


class Document(Base):
    __tablename__ = "documents"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    original_name = Column(String(255), nullable=False)
    content_type = Column(String(100), nullable=False)
    size_bytes = Column(Integer, nullable=False)
    uploaded_at = Column(DateTime(timezone=True), nullable=False, default=utc_now)
    storage_path = Column(String(500), nullable=False)
    extracted_text = Column(Text, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "originalName": self.original_name,
            "contentType": self.content_type,
            "sizeBytes": self.size_bytes,
            "uploadedAt": self.uploaded_at.isoformat() if self.uploaded_at else None,
        }
