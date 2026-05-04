import uuid

from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse

from app.schemas import AiChatRequest, ApiEnvelope
from app.services.ai_orchestrator import stream_ai_response

router = APIRouter(prefix="/api/v1/ai", tags=["ai"])


@router.post("/chat")
def chat_ai(payload: AiChatRequest, request: Request) -> StreamingResponse:
    trace_id = getattr(request.state, "trace_id", str(uuid.uuid4()))

    async def event_generator():
        async for chunk in stream_ai_response(payload, trace_id):
            yield chunk

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "x-trace-id": trace_id,
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )
