import json
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from app.domains.ai.schemas import AiChatRequest
from app.domains.ai.service import stream_ai_response


class MockAsyncStream:
    def __init__(self, chunks):
        self._chunks = chunks
        self._index = 0

    def __aiter__(self):
        return self

    async def __anext__(self):
        if self._index >= len(self._chunks):
            raise StopAsyncIteration
        chunk = self._chunks[self._index]
        self._index += 1
        return chunk


def _make_chunk(content: str):
    chunk = MagicMock()
    chunk.choices = [MagicMock()]
    chunk.choices[0].delta = MagicMock()
    chunk.choices[0].delta.content = content
    return chunk


@pytest.mark.asyncio
async def test_react_parse_time_internal_loop():
    """Test that a parse_time action triggers internal ReAct loop and yields final."""
    # Round 1: LLM asks to parse_time
    round1 = _make_chunk(
        "Thought: 用户想明天下午3点开会\n"
        'Action: parse_time\n'
        'Action Input: {"expression": "明天下午3点", "timezone": "Asia/Shanghai", "reference_time": "2026-05-04T10:00:00+08:00"}'
    )
    # Round 2: LLM returns final after seeing Observation
    round2 = _make_chunk(
        "Thought: 解析成功，时间已确定\n"
        'Final Answer: {"action": "create_schedule", "params": {"title": "会议", "start_at": "2026-05-05T15:00:00+08:00"}, "confidence": 0.95}'
    )

    mock_client = MagicMock()
    mock_client.chat.completions.create = AsyncMock(side_effect=[
        MockAsyncStream([round1]),
        MockAsyncStream([round2]),
    ])

    with patch("app.domains.ai.service._get_client", return_value=mock_client):
        request = AiChatRequest(text="明天下午3点开会")
        events = []
        async for event in stream_ai_response(request, "test-trace"):
            events.append(event)

        # Parse SSE events
        parsed = []
        for ev in events:
            lines = ev.strip().split("\n")
            if len(lines) >= 2:
                event_name = lines[0].replace("event: ", "")
                data = json.loads(lines[1].replace("data: ", ""))
                parsed.append((event_name, data))

        event_names = [e for e, _ in parsed]
        assert "stage" in event_names
        assert "thought" in event_names
        assert "final" in event_names
        assert "done" in event_names

        # Find final command
        final_data = next(d for e, d in parsed if e == "final")
        assert final_data["command"]["action"] == "create_schedule"
        assert final_data["command"]["params"]["title"] == "会议"

        # Verify two LLM calls (internal loop)
        assert mock_client.chat.completions.create.call_count == 2


@pytest.mark.asyncio
async def test_react_client_action_query_schedule():
    """Test that a client-side action yields action event and done with needsContinuation."""
    chunk = _make_chunk(
        "Thought: 用户想查询设计评审会\n"
        'Action: query_schedule\n'
        'Action Input: {"keyword": "设计评审会"}'
    )

    mock_client = MagicMock()
    mock_client.chat.completions.create = AsyncMock(return_value=MockAsyncStream([chunk]))

    with patch("app.domains.ai.service._get_client", return_value=mock_client):
        request = AiChatRequest(text="帮我查一下设计评审会")
        events = []
        async for event in stream_ai_response(request, "test-trace"):
            events.append(event)

        parsed = []
        for ev in events:
            lines = ev.strip().split("\n")
            if len(lines) >= 2:
                event_name = lines[0].replace("event: ", "")
                data = json.loads(lines[1].replace("data: ", ""))
                parsed.append((event_name, data))

        event_names = [e for e, _ in parsed]
        assert "action" in event_names
        assert "done" in event_names

        action_data = next(d for e, d in parsed if e == "action")
        assert action_data["tool"] == "query_schedule"
        assert action_data["params"]["keyword"] == "设计评审会"

        done_data = next(d for e, d in parsed if e == "done")
        assert done_data["needsContinuation"] is True
