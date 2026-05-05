from fastapi import APIRouter, Depends, Request

from app.core.schemas import ApiEnvelope
from app.dependencies import get_trace_id
from app.domains.schedule.schemas import ParseRequest
from app.domains.schedule.service import mock_parse_schedule

router = APIRouter(prefix="/api/v1/schedule", tags=["schedule"])


@router.post("/parse", response_model=ApiEnvelope)
def parse_schedule(payload: ParseRequest, request: Request, trace_id: str = Depends(get_trace_id)) -> ApiEnvelope:
    try:
        draft = mock_parse_schedule(payload.text, payload.timezone, payload.locale)
        return ApiEnvelope(code=0, msg="ok", data=draft, traceId=trace_id)
    except Exception:
        return ApiEnvelope(code=10001, msg="parse_failed", data=None, traceId=trace_id)
