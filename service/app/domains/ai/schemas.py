from typing import Any, Optional

from pydantic import BaseModel, Field


class AiChatContext(BaseModel):
    currentTime: Optional[str] = None
    availableTags: Optional[list[str]] = None


class AiToolCall(BaseModel):
    id: str = ""
    type: str = "function"
    function: dict[str, Any] = Field(default_factory=dict)


class AiMessage(BaseModel):
    role: str = Field(..., description="One of: system, user, assistant, tool")
    content: str = ""
    tool_calls: Optional[list[AiToolCall]] = None
    tool_call_id: Optional[str] = None
    name: Optional[str] = None


class AiChatRequest(BaseModel):
    text: str = Field(..., min_length=1)
    timezone: Optional[str] = None
    locale: Optional[str] = None
    context: Optional[dict[str, Any]] = None
    messages: Optional[list[AiMessage]] = None


class AiCommand(BaseModel):
    action: str = Field(..., description="One of: create_schedule, update_schedule, delete_schedule, query_schedule, chat")
    params: dict[str, Any] = Field(default_factory=dict)
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)


class StreamEvent(BaseModel):
    event: str = Field(..., description="One of: stage, thought, command, done, error")
    data: dict[str, Any]
