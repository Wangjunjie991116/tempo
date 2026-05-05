from fastapi import Request
from fastapi.responses import JSONResponse


class AppException(Exception):
    def __init__(self, code: int, msg: str) -> None:
        self.code = code
        self.msg = msg


async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    from app.core.schemas import ApiEnvelope
    from app.dependencies import get_trace_id

    trace_id = get_trace_id(request)
    envelope = ApiEnvelope(code=exc.code, msg=exc.msg, data=None, traceId=trace_id)
    return JSONResponse(status_code=200, content=envelope.model_dump())


async def validation_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    from app.core.schemas import ApiEnvelope
    from app.dependencies import get_trace_id

    _ = exc
    trace_id = get_trace_id(request)
    envelope = ApiEnvelope(code=10002, msg="invalid_request", data=None, traceId=trace_id)
    return JSONResponse(status_code=200, content=envelope.model_dump())


async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    import logging

    from app.core.schemas import ApiEnvelope
    from app.dependencies import get_trace_id

    logger = logging.getLogger(__name__)
    logger.exception("Unhandled exception: %s", exc)

    trace_id = get_trace_id(request)
    envelope = ApiEnvelope(code=10001, msg="internal_error", data=None, traceId=trace_id)
    return JSONResponse(status_code=200, content=envelope.model_dump())
