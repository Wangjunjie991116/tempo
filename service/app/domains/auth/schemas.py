from typing import Optional

from pydantic import BaseModel, Field


class AuthRegisterRequest(BaseModel):
    email: str = Field(..., min_length=1)
    password: str = Field(..., min_length=1)
    full_name: Optional[str] = None


class AuthLoginRequest(BaseModel):
    email: str = Field(..., min_length=1)
    password: str = Field(..., min_length=1)


class AuthResetPasswordRequest(BaseModel):
    email: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=1)


class UserOut(BaseModel):
    id: str
    email: str
    full_name: Optional[str] = None
