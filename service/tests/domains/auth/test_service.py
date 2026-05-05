import pytest
from app.domains.auth.service import register, login, reset_password, get_user_by_email
from app.domains.auth.models import user_repository


@pytest.fixture(autouse=True)
def reset_repo():
    """Reset in-memory repository before each test."""
    user_repository._users.clear()
    user_repository._email_index.clear()


def test_register_and_login():
    user = register("test@example.com", "password123", "Test User")
    assert user.email == "test@example.com"
    assert user.full_name == "Test User"

    logged_in = login("test@example.com", "password123")
    assert logged_in is not None
    assert logged_in.id == user.id


def test_login_invalid_password():
    register("test@example.com", "password123")
    assert login("test@example.com", "wrong") is None


def test_login_nonexistent_user():
    assert login("noone@example.com", "password123") is None


def test_register_duplicate_email():
    register("test@example.com", "password123")
    with pytest.raises(ValueError, match="email_already_exists"):
        register("test@example.com", "password123")


def test_reset_password():
    user = register("test@example.com", "password123")
    updated = reset_password("test@example.com", "newpassword")
    assert updated is not None
    assert updated.check_password("newpassword") is True
    assert updated.check_password("password123") is False


def test_reset_password_nonexistent():
    assert reset_password("noone@example.com", "newpassword") is None


def test_whitelist_login():
    """Whitelist users can log in without prior registration."""
    from app.core.config import settings
    email = list(settings.auth_whitelist.keys())[0]
    password = settings.auth_whitelist[email]
    user = login(email, password)
    assert user is not None
    assert user.email == email
