from __future__ import annotations

from fastapi.testclient import TestClient


def _start_session(client: TestClient, headers: dict[str, str], duration: int = 30) -> dict:
    response = client.post("/api/v1/sessions", json={"duration": duration}, headers=headers)
    assert response.status_code == 201
    return response.json()


def test_start_session_requires_auth(client: TestClient) -> None:
    response = client.post("/api/v1/sessions", json={"duration": 30})
    assert response.status_code == 401


def test_cannot_start_second_active_session(client: TestClient, auth_headers: dict[str, str]) -> None:
    first = client.post("/api/v1/sessions", json={"duration": 30}, headers=auth_headers)
    assert first.status_code == 201
    second = client.post("/api/v1/sessions", json={"duration": 15}, headers=auth_headers)
    assert second.status_code == 409


def test_session_lifecycle(client: TestClient, auth_headers: dict[str, str]) -> None:
    session = _start_session(client, auth_headers, duration=30)
    assert session["status"] == "running"
    session_id = session["id"]

    paused = client.patch(
        f"/api/v1/sessions/{session_id}",
        json={"action": "pause"},
        headers=auth_headers,
    )
    assert paused.status_code == 200
    assert paused.json()["status"] == "paused"

    resumed = client.patch(
        f"/api/v1/sessions/{session_id}",
        json={"action": "resume"},
        headers=auth_headers,
    )
    assert resumed.status_code == 200
    assert resumed.json()["status"] == "running"

    completed = client.patch(
        f"/api/v1/sessions/{session_id}",
        json={"action": "complete"},
        headers=auth_headers,
    )
    assert completed.status_code == 200
    body = completed.json()
    assert body["status"] == "completed"
    assert body["ended_at"] is not None
    assert body["duration"] == 30


def test_stop_session_is_cancelled(client: TestClient, auth_headers: dict[str, str]) -> None:
    session = _start_session(client, auth_headers)
    session_id = session["id"]

    stopped = client.patch(
        f"/api/v1/sessions/{session_id}",
        json={"action": "stop"},
        headers=auth_headers,
    )
    assert stopped.status_code == 200
    body = stopped.json()
    assert body["status"] == "cancelled"
    assert body["ended_at"] is not None


def test_invalid_transition_returns_400(client: TestClient, auth_headers: dict[str, str]) -> None:
    session = _start_session(client, auth_headers)
    session_id = session["id"]

    client.patch(f"/api/v1/sessions/{session_id}", json={"action": "complete"}, headers=auth_headers)

    invalid = client.patch(
        f"/api/v1/sessions/{session_id}",
        json={"action": "pause"},
        headers=auth_headers,
    )
    assert invalid.status_code == 400


def test_list_and_get_session(client: TestClient, auth_headers: dict[str, str]) -> None:
    session = _start_session(client, auth_headers, duration=45)
    session_id = session["id"]

    listed = client.get("/api/v1/sessions", headers=auth_headers)
    assert listed.status_code == 200
    assert len(listed.json()) >= 1

    detail = client.get(f"/api/v1/sessions/{session_id}", headers=auth_headers)
    assert detail.status_code == 200
    assert detail.json()["duration"] == 45


def test_get_session_not_found(client: TestClient, auth_headers: dict[str, str]) -> None:
    response = client.get(
        "/api/v1/sessions/00000000-0000-0000-0000-000000000000",
        headers=auth_headers,
    )
    assert response.status_code == 404
