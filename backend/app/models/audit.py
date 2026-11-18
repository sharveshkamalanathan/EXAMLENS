import uuid
import json
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.session import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    entity_type = Column(String(50), nullable=False)  # exam, evaluation, script, publication
    entity_id = Column(String(36), nullable=False, index=True)
    action = Column(String(100), nullable=False)  # score_override, approved, published, unpublished, ocr_corrected
    previous_data_json = Column(Text, nullable=True)
    new_data_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User")

    @property
    def previous_data(self):
        try:
            return json.loads(self.previous_data_json or "{}")
        except Exception:
            return {}

    @property
    def new_data(self):
        try:
            return json.loads(self.new_data_json or "{}")
        except Exception:
            return {}
