import uuid

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_parse_success_envelope():
    resp = client.post(
        "/api/v1/schedule/parse",
        json={
            "text": "明天下午3点和老王开会一小时",
            "timezone": "Asia/Shanghai",
            "locale": "zh-CN",
        },
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["code"] == 0
    assert body["msg"] == "ok"
    assert body["traceId"]
    uuid.UUID(body["traceId"])
    data = body["data"]
    assert data["title"]
    assert data["all_day"] is False


def test_parse_error_when_text_missing():
    resp = client.post("/api/v1/schedule/parse", json={})
    assert resp.status_code == 200
    body = resp.json()
    assert body["code"] != 0
    assert body["data"] is None
    assert body["traceId"]
