import os
import uuid

from fastapi import Request
from fastapi.middleware.cors import CORSMiddleware


async def trace_middleware(request: Request, call_next) -> None:
    trace_id = request.headers.get("x-trace-id") or str(uuid.uuid4())
    request.state.trace_id = trace_id
    response = await call_next(request)
    response.headers["x-trace-id"] = trace_id
    return response


def add_cors_middleware(app) -> None:
    """添加 CORS 中间件。

    生产环境通过 CORS_ORIGINS 环境变量配置允许的源，
    多个源用逗号分隔。未配置时默认允许所有源（仅限开发环境）。
    """
    cors_origins_env = os.getenv("CORS_ORIGINS", "")
    if cors_origins_env:
        allow_origins = [origin.strip() for origin in cors_origins_env.split(",")]
    else:
        allow_origins = ["*"]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=allow_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
