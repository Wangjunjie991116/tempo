from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError

from app.core.exceptions import (
    AppException,
    app_exception_handler,
    generic_exception_handler,
    validation_exception_handler,
)
from app.core.logging import setup_logging
from app.core.middleware import add_cors_middleware, trace_middleware
from app.domains import ai, auth, schedule

setup_logging()

app = FastAPI(title="Tempo Service")

app.middleware("http")(trace_middleware)
add_cors_middleware(app)

app.add_exception_handler(AppException, app_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)

app.include_router(schedule.router)
app.include_router(ai.router)
app.include_router(auth.router)
