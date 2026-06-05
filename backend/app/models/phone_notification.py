import uuid
from sqlalchemy import Column, String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base


class PhoneNotification(Base):
    __tablename__ = "phone_notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    notif_id = Column(String, nullable=True)
    app_name = Column(String, nullable=False)
    title = Column(String, nullable=True)
    text = Column(Text, nullable=True)
    is_read = Column(Boolean, default=False)
    received_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="phone_notifications")
