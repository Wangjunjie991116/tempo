import json
import os
from datetime import datetime, timedelta, timezone
from typing import AsyncGenerator, Optional

from openai import AsyncOpenAI

from app.schemas import AiChatRequest, AiCommand, StreamEvent


def _log(label: str, data: dict | str | None = None) -> None:
    prefix = "[ai-orchestrator]"
    if data is None:
        print(f"{prefix} {label}")
    elif isinstance(data, str):
        print(f"{prefix} {label}: {data}")
    else:
        print(f"{prefix} {label}: {json.dumps(data, ensure_ascii=False)}")

_client: Optional[AsyncOpenAI] = None


def _get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        base_url = os.getenv("OPENAI_BASE_URL", "https://gpt-agent.cc")
        api_key = os.getenv("OPENAI_API_KEY", "")
        _client = AsyncOpenAI(base_url=base_url, api_key=api_key)
    return _client


def _build_system_prompt(request: AiChatRequest) -> str:
    from app.services.prompt_templates import SYSTEM_PROMPT

    now = datetime.now(timezone.utc).astimezone()
    tz = request.timezone or "UTC"
    locale = request.locale or "en"
    tags = request.context.get("availableTags", ["design_review", "workshop", "brainstorm"]) if request.context else ["design_review", "workshop", "brainstorm"]

    tomorrow = (now + timedelta(days=1)).strftime("%Y-%m-%d")
    next_monday = (now + timedelta(days=(7 - now.weekday()) % 7 or 7)).strftime("%Y-%m-%d")
    next_sunday = (now + timedelta(days=(7 - now.weekday()) % 7 or 7) + timedelta(days=6)).strftime("%Y-%m-%d")

    # 使用 replace 而非 format，避免 prompt 中的 JSON { } 被误解析为占位符
    return (
        SYSTEM_PROMPT.replace("{current_time}", now.isoformat())
        .replace("{timezone}", tz)
        .replace("{locale}", locale)
        .replace("{available_tags}", ", ".join(tags))
        .replace("{tomorrow}", tomorrow)
        .replace("{next_monday}", next_monday)
        .replace("{next_sunday}", next_sunday)
    )



def _sse_event(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"


def _parse_command_from_buffer(buffer: str) -> tuple[str, dict, str]:
    """从完整的 thinking buffer 中解析 JSON command。
    返回 (action, params, thinking_display)。
    """
    import re

    # 1. 尝试匹配 ```json ... ``` 代码块
    m = re.search(r"```json\s*(\{.*?\})\s*```", buffer, re.DOTALL)
    if m:
        try:
            parsed = json.loads(m.group(1))
            action = parsed.get("action", "chat")
            params = parsed.get("params", {})
            thinking = buffer[:m.start()].strip()
            return action, params, thinking
        except json.JSONDecodeError:
            pass

    # 2. fallback: 尝试匹配任意包含 "action" 的 JSON 对象
    m = re.search(r"\{[\s\S]*\"action\"[\s\S]*\}", buffer, re.DOTALL)
    if m:
        try:
            parsed = json.loads(m.group(0))
            action = parsed.get("action", "chat")
            params = parsed.get("params", {})
            thinking = buffer[:m.start()].strip()
            return action, params, thinking
        except json.JSONDecodeError:
            pass

    # 3. 完全没匹配到 JSON → fallback chat
    return "chat", {"response": buffer or "有什么可以帮你的吗？"}, buffer


async def stream_ai_response(request: AiChatRequest, trace_id: str) -> AsyncGenerator[str, None]:
    client = _get_client()
    model = os.getenv("OPENAI_MODEL", "deepseek-v4-pro")
    system_prompt = _build_system_prompt(request)

    _log("=== NEW REQUEST ===", {"trace_id": trace_id, "text": request.text, "model": model})

    # Stage 1: understanding
    yield _sse_event("stage", {"stage": "understanding", "label": "正在理解你的意图..."})

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": request.text},
    ]
    _log("messages_count", str(len(messages)))

    try:
        _log("calling_llm", "start (no tools, prompt-based JSON)")
        stream = await client.chat.completions.create(
            model=model,
            messages=messages,
            stream=True,
            temperature=0.3,
        )
        _log("calling_llm", "stream_created")
    except Exception as e:
        _log("llm_error", str(e))
        yield _sse_event("error", {"code": 10003, "message": f"LLM service unavailable: {str(e)}"})
        return

    # Stage 2: analyzing
    yield _sse_event("stage", {"stage": "analyzing", "label": "正在分析时间和参与者..."})

    raw_buffer = ""
    chunk_count = 0

    async for chunk in stream:
        chunk_count += 1
        delta = chunk.choices[0].delta

        if delta.content:
            raw_buffer += delta.content
            _log("chunk_content", delta.content[:200])
            yield _sse_event("thought", {"delta": delta.content})

    _log("stream_end", {"total_chunks": chunk_count, "raw_buffer_length": len(raw_buffer)})

    # Stage 3: parse JSON command from buffer
    yield _sse_event("stage", {"stage": "thinking", "label": "正在规划最佳安排..."})

    action, params, thinking_display = _parse_command_from_buffer(raw_buffer)
    _log("parsed_command", {"action": action, "params": params, "thinking_preview": thinking_display[:300]})

    # Stage 4: confirming
    yield _sse_event("stage", {"stage": "confirming", "label": "准备执行操作..."})

    # Estimate confidence
    parsed_confidence = params.pop("confidence", None) if isinstance(params, dict) else None
    if parsed_confidence is not None:
        confidence = float(parsed_confidence)
    elif action == "chat":
        confidence = 1.0
    elif action == "create_schedule" and (not params.get("start_at") or not params.get("title")):
        confidence = 0.5
    else:
        confidence = 0.9

    command = AiCommand(action=action, params=params, confidence=confidence)
    _log("final_command", command.model_dump())
    yield _sse_event("command", command.model_dump())
    yield _sse_event("done", {"traceId": trace_id})
