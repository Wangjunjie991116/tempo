"""用户模型与内存仓库（后续可替换为数据库持久化）。"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional
import uuid
import secrets
import hashlib


def _hash_password(password: str) -> str:
    """对密码进行简单哈希（生产环境应使用 bcrypt / argon2）。"""
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


@dataclass
class User:
    id: str
    email: str
    password_hash: str
    full_name: Optional[str] = None
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())

    def check_password(self, password: str) -> bool:
        return self.password_hash == _hash_password(password)


class _UserRepository:
    """内存用户仓库（单例）。"""

    def __init__(self):
        self._users: dict[str, User] = {}
        self._email_index: dict[str, str] = {}

    def create(self, email: str, password: str, full_name: Optional[str] = None) -> User:
        if self.find_by_email(email):
            raise ValueError("email_already_exists")
        user = User(
            id=str(uuid.uuid4()),
            email=email,
            password_hash=_hash_password(password),
            full_name=full_name,
        )
        self._users[user.id] = user
        self._email_index[user.email] = user.id
        return user

    def find_by_email(self, email: str) -> Optional[User]:
        user_id = self._email_index.get(email)
        return self._users.get(user_id) if user_id else None

    def find_by_id(self, user_id: str) -> Optional[User]:
        return self._users.get(user_id)

    def update_password(self, email: str, new_password: str) -> Optional[User]:
        user = self.find_by_email(email)
        if not user:
            return None
        user.password_hash = _hash_password(new_password)
        return user


user_repository = _UserRepository()
