from typing import Optional

from pydantic import BaseModel, Field


class ParseRequest(BaseModel):
    text: str = Field(..., min_length=1)
    timezone: Optional[str] = None
    locale: Optional[str] = None


class ScheduleDraft(BaseModel):
    title: str
    start_at: Optional[str] = None
    end_at: Optional[str] = None
    all_day: bool = False
    confidence: float = 0
    notes: Optional[str] = None


class ApiEnvelope(BaseModel):
    code: int
    msg: str
    data: Optional[ScheduleDraft] = None
    traceId: str
