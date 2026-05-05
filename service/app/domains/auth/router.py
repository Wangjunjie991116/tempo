from fastapi import APIRouter, Depends, Request

from app.core.exceptions import AppException
from app.core.schemas import ApiEnvelope
from app.dependencies import get_trace_id
from app.domains.auth import service as auth_service
from app.domains.auth.schemas import AuthLoginRequest, AuthRegisterRequest, AuthResetPasswordRequest, UserOut

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.post("/register")
def register(payload: AuthRegisterRequest, request: Request, trace_id: str = Depends(get_trace_id)) -> ApiEnvelope:
    try:
        user = auth_service.register(payload.email, payload.password, payload.full_name)
    except ValueError as e:
        raise AppException(code=10001, msg=str(e))
    return ApiEnvelope(
        code=0,
        msg="ok",
        data=UserOut(id=user.id, email=user.email, full_name=user.full_name),
        traceId=trace_id,
    )


@router.post("/login")
def login(payload: AuthLoginRequest, request: Request, trace_id: str = Depends(get_trace_id)) -> ApiEnvelope:
    user = auth_service.login(payload.email, payload.password)
    if not user:
        raise AppException(code=10001, msg="invalid_credentials")
    return ApiEnvelope(
        code=0,
        msg="ok",
        data=UserOut(id=user.id, email=user.email, full_name=user.full_name),
        traceId=trace_id,
    )


@router.post("/forgot-password")
def forgot_password(payload: AuthLoginRequest, request: Request, trace_id: str = Depends(get_trace_id)) -> ApiEnvelope:
    """发送验证码（当前为占位实现，直接返回成功）。"""
    user = auth_service.get_user_by_email(payload.email)
    if not user:
        raise AppException(code=10001, msg="email_not_found")
    return ApiEnvelope(code=0, msg="ok", data=None, traceId=trace_id)


@router.post("/reset-password")
def reset_password(payload: AuthResetPasswordRequest, request: Request, trace_id: str = Depends(get_trace_id)) -> ApiEnvelope:
    user = auth_service.reset_password(payload.email, payload.new_password)
    if not user:
        raise AppException(code=10001, msg="email_not_found")
    return ApiEnvelope(
        code=0,
        msg="ok",
        data=UserOut(id=user.id, email=user.email, full_name=user.full_name),
        traceId=trace_id,
    )
