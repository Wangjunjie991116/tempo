"""认证业务逻辑层。"""

from typing import Optional

from app.core.config import settings
from app.domains.auth.models import user_repository, User


def register(email: str, password: str, full_name: Optional[str] = None) -> User:
    """用户注册。"""
    return user_repository.create(email, password, full_name)


def login(email: str, password: str) -> Optional[User]:
    """用户登录，支持白名单直接通过。"""
    if email in settings.auth_whitelist and settings.auth_whitelist[email] == password:
        user = user_repository.find_by_email(email)
        if not user:
            user = user_repository.create(email, password, full_name="Admin")
        return user

    user = user_repository.find_by_email(email)
    if not user:
        return None
    if not user.check_password(password):
        return None
    return user


def reset_password(email: str, new_password: str) -> Optional[User]:
    """重置密码。"""
    return user_repository.update_password(email, new_password)


def get_user_by_email(email: str) -> Optional[User]:
    return user_repository.find_by_email(email)
