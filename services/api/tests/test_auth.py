from __future__ import annotations

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.login_event import LoginEvent


def _register(client: TestClient, email: str = "user@example.com", password: str = "password123") -> dict:
    response = client.post(
        "/api/v1/auth/register",
        json={"name": "Test User", "email": email, "password": password},
    )
    assert response.status_code == 201
    return response.json()


def test_register_and_login(client: TestClient) -> None:
    registered = _register(client)
    assert registered["access_token"]
    assert registered["user"]["email"] == "user@example.com"

    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": "user@example.com", "password": "password123"},
    )
    assert login_response.status_code == 200
    assert login_response.json()["access_token"]


def test_register_duplicate_email_returns_409(client: TestClient) -> None:
    _register(client)
    response = client.post(
        "/api/v1/auth/register",
        json={"name": "Another User", "email": "user@example.com", "password": "password123"},
    )
    assert response.status_code == 409


def test_login_invalid_credentials_returns_401(client: TestClient) -> None:
    _register(client)
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "user@example.com", "password": "wrong-password"},
    )
    assert response.status_code == 401


def test_protected_route_requires_auth(client: TestClient) -> None:
    response = client.get("/api/v1/users/me")
    assert response.status_code == 401


def test_protected_route_with_valid_token(client: TestClient) -> None:
    registered = _register(client)
    token = registered["access_token"]
    response = client.get(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert response.json()["email"] == "user@example.com"


def test_logout_invalidates_token(client: TestClient) -> None:
    registered = _register(client)
    token = registered["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    logout_response = client.post("/api/v1/auth/logout", headers=headers)
    assert logout_response.status_code == 200

    me_response = client.get("/api/v1/users/me", headers=headers)
    assert me_response.status_code == 401


def test_register_whitespace_name_returns_422(client: TestClient) -> None:
    response = client.post(
        "/api/v1/auth/register",
        json={"name": "   ", "email": "blank@example.com", "password": "password123"},
    )
    assert response.status_code == 422


def test_password_reset_flow(client: TestClient) -> None:
    _register(client, email="reset@example.com")

    request_response = client.post(
        "/api/v1/auth/reset-password",
        json={"email": "reset@example.com"},
    )
    assert request_response.status_code == 200
    reset_token = request_response.json()["reset_token"]
    assert reset_token

    complete_response = client.post(
        "/api/v1/auth/reset-password",
        json={"token": reset_token, "new_password": "newpassword99"},
    )
    assert complete_response.status_code == 200

    old_login = client.post(
        "/api/v1/auth/login",
        json={"email": "reset@example.com", "password": "password123"},
    )
    assert old_login.status_code == 401

    new_login = client.post(
        "/api/v1/auth/login",
        json={"email": "reset@example.com", "password": "newpassword99"},
    )
    assert new_login.status_code == 200


def test_register_creates_login_event(client: TestClient, db_session: Session) -> None:
    _register(client, email="audit@example.com")

    events = db_session.query(LoginEvent).filter(LoginEvent.email == "audit@example.com").all()
    assert len(events) == 1
    assert events[0].event_type == "register"
    assert events[0].success is True
    assert events[0].user_id is not None


def test_login_records_success_and_failure(client: TestClient, db_session: Session) -> None:
    _register(client, email="audit-login@example.com")

    failed = client.post(
        "/api/v1/auth/login",
        json={"email": "audit-login@example.com", "password": "wrong-password"},
    )
    assert failed.status_code == 401

    success = client.post(
        "/api/v1/auth/login",
        json={"email": "audit-login@example.com", "password": "password123"},
    )
    assert success.status_code == 200

    events = (
        db_session.query(LoginEvent)
        .filter(LoginEvent.email == "audit-login@example.com", LoginEvent.event_type == "login")
        .order_by(LoginEvent.created_at)
        .all()
    )
    assert len(events) == 2
    assert events[0].success is False
    assert events[1].success is True

