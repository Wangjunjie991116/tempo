import uuid

from fastapi import APIRouter, Request

from app.schemas import ApiEnvelope, ParseRequest
from app.services.mock_parse import mock_parse_schedule

router = APIRouter(prefix="/api/v1/schedule", tags=["schedule"])


@router.post("/parse", response_model=ApiEnvelope)
def parse_schedule(payload: ParseRequest, request: Request) -> ApiEnvelope:
    trace_id = getattr(request.state, "trace_id", str(uuid.uuid4()))
    try:
        draft = mock_parse_schedule(payload.text, payload.timezone, payload.locale)
        return ApiEnvelope(code=0, msg="ok", data=draft, traceId=trace_id)
    except Exception:
        return ApiEnvelope(code=10001, msg="parse_failed", data=None, traceId=trace_id)
