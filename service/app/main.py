import uuid

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.routers import schedule
from app.schemas import ApiEnvelope

app = FastAPI(title="Tempo Service")


@app.middleware("http")
async def trace_middleware(request: Request, call_next):
    trace_id = request.headers.get("x-trace-id") or str(uuid.uuid4())
    request.state.trace_id = trace_id
    response = await call_next(request)
    response.headers["x-trace-id"] = trace_id
    return response


@app.exception_handler(RequestValidationError)
async def validation_handler(request: Request, exc: RequestValidationError):
    _ = exc
    trace_id = getattr(request.state, "trace_id", str(uuid.uuid4()))
    envelope = ApiEnvelope(code=10002, msg="invalid_request", data=None, traceId=trace_id)
    return JSONResponse(status_code=200, content=envelope.model_dump())


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(schedule.router)
