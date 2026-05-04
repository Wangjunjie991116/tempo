import json
import os
import re
from datetime import datetime, timedelta, timezone
from typing import AsyncGenerator, Optional

from openai import AsyncOpenAI

from app.schemas import AiChatRequest, AiCommand, StreamEvent
from app.services.prompt_templates import SYSTEM_PROMPT
from app.services.time_parser import parse_time


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
        base_url = os.getenv("OPENAI_BASE_URL", "https://gpt-agent.cc/v1")
        api_key = os.getenv("OPENAI_API_KEY", "")
        _client = AsyncOpenAI(base_url=base_url, api_key=api_key)
    return _client


def _build_system_prompt(request: AiChatRequest) -> str:
    now = datetime.now(timezone.utc).astimezone()
    tz = request.timezone or "UTC"
    locale = request.locale or "en"
    tags = request.context.get("availableTags", ["design_review", "workshop", "brainstorm"]) if request.context else ["design_review", "workshop", "brainstorm"]

    tomorrow = (now + timedelta(days=1)).strftime("%Y-%m-%d")
    next_monday = (now + timedelta(days=(7 - now.weekday()) % 7 or 7)).strftime("%Y-%m-%d")
    next_sunday = (now + timedelta(days=(7 - now.weekday()) % 7 or 7) + timedelta(days=6)).strftime("%Y-%m-%d")

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


def _extract_json(s: str) -> dict | None:
    """Extract the first JSON object from a string using raw_decode."""
    s = s.strip()
    if s.startswith("```json"):
        s = s[7:].strip()
    if s.endswith("```"):
        s = s[:-3].strip()
    try:
        decoder = json.JSONDecoder()
        obj, _ = decoder.raw_decode(s)
        if isinstance(obj, dict):
            return obj
    except json.JSONDecodeError:
        pass
    return None


def _parse_xml_tool_call(text: str) -> dict | None:
    """Parse <tool_call> XML format that some models output instead of ReAct.
    Returns {"type": "action", "thought": str, "action": str, "action_input": dict} or None.
    """
    m = re.search(r"<tool_call\s+name=\"(\w+)\"\s*>(.*?)</tool_call>", text, re.DOTALL)
    if not m:
        return None

    action_name = m.group(1)
    inner = m.group(2)

    action_input: dict[str, str] = {}
    for param_m in re.finditer(r"<parameter\s+name=\"([^\"]+)\"[^>]*>(.*?)</parameter>", inner, re.DOTALL):
        key = param_m.group(1)
        val = param_m.group(2).strip()
        action_input[key] = val

    if not action_input:
        return None

    thought = text[:m.start()].strip()
    return {"type": "action", "thought": thought, "action": action_name, "action_input": action_input}


def _parse_react_output(text: str) -> dict:
    """Parse ReAct format output from LLM.
    Returns: {"type": "action", "thought": str, "action": str, "action_input": dict} |
             {"type": "final", "thought": str, "command": dict}
    """
    # Try to find Final Answer first (use rfind to get the last occurrence)
    final_idx = text.rfind("Final Answer:")
    if final_idx != -1:
        after_final = text[final_idx + len("Final Answer:"):].strip()
        command = _extract_json(after_final)
        if command:
            thought = text[:final_idx].strip()
            return {"type": "final", "thought": thought, "command": command}

    # Try to find Action
    action_match = re.search(r"Action:\s*(\w+)\s*Action Input:\s*(```json\s*)?(\{.*?\})(\s*```)?", text, re.DOTALL)
    if action_match:
        try:
            action_name = action_match.group(1)
            action_input = json.loads(action_match.group(3))
            thought = text[:action_match.start()].strip()
            return {"type": "action", "thought": thought, "action": action_name, "action_input": action_input}
        except json.JSONDecodeError:
            pass

    # Fallback: some models output <tool_call> XML instead of ReAct text
    xml_tool = _parse_xml_tool_call(text)
    if xml_tool:
        return xml_tool

    # Fallback: try any JSON block
    json_match = re.search(r"```json\s*(\{.*?\})\s*```", text, re.DOTALL)
    if json_match:
        try:
            command = json.loads(json_match.group(1))
            thought = text[:json_match.start()].strip()
            return {"type": "final", "thought": thought, "command": command}
        except json.JSONDecodeError:
            pass

    # Complete fallback
    return {"type": "final", "thought": text, "command": {"action": "chat", "params": {"response": text or "有什么可以帮你的吗？"}, "confidence": 1.0}}


async def stream_ai_response(request: AiChatRequest, trace_id: str) -> AsyncGenerator[str, None]:
    system_prompt = _build_system_prompt(request)
    model = os.getenv("OPENAI_MODEL", "deepseek-v4-pro")

    _log("=== NEW REQUEST ===", {"trace_id": trace_id, "text": request.text, "model": model})

    # Build messages
    if request.messages:
        messages = [{"role": m.role, "content": m.content} for m in request.messages]
        # Ensure system prompt is first
        if not messages or messages[0]["role"] != "system":
            messages.insert(0, {"role": "system", "content": system_prompt})
    else:
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": request.text},
        ]

    _log("messages_count", str(len(messages)))

    # ReAct loop
    max_steps = 5
    for step in range(max_steps):
        _log("react_step", f"{step + 1}/{max_steps}")

        # Stage
        if step == 0:
            yield _sse_event("stage", {"stage": "understanding", "label": "正在理解你的意图..."})
        else:
            yield _sse_event("stage", {"stage": "thinking", "label": "正在规划最佳安排..."})

        # Call LLM
        client = _get_client()
        try:
            _log("calling_llm", "start")
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

        buffer = ""
        chunk_count = 0

        try:
            async for chunk in stream:
                chunk_count += 1
                if not chunk.choices or len(chunk.choices) == 0:
                    continue
                delta = chunk.choices[0].delta
                if delta is None or delta.content is None:
                    continue

                buffer += delta.content
                yield _sse_event("thought", {"delta": delta.content})
        except Exception as e:
            _log("stream_error", str(e))
            yield _sse_event("error", {"code": 10004, "message": f"流式传输中断: {str(e)}"})
            return

        _log("stream_end", {"total_chunks": chunk_count, "buffer_length": len(buffer)})

        # Parse output
        result = _parse_react_output(buffer)
        _log("parsed_output", {"type": result["type"], "thought_preview": result.get("thought", "")[:200]})

        if result["type"] == "final":
            command = result.get("command", {})
            action = command.get("action", "chat")
            params = command.get("params", {})
            confidence = float(command.get("confidence", 0.9))

            cmd = AiCommand(action=action, params=params, confidence=confidence)
            _log("final_command", cmd.model_dump())

            yield _sse_event("stage", {"stage": "confirming", "label": "准备执行操作..."})
            yield _sse_event("final", {"command": cmd.model_dump()})
            yield _sse_event("done", {"traceId": trace_id, "needsContinuation": False})
            return

        elif result["type"] == "action":
            action_name = result["action"]
            action_input = result.get("action_input", {})
            thought = result.get("thought", "")

            yield _sse_event("action", {"tool": action_name, "params": action_input})

            # Execute backend tools internally
            if action_name == "parse_time":
                expression = action_input.get("expression", "")
                tz = action_input.get("timezone", request.timezone or "UTC")
                ref = action_input.get("reference_time", datetime.now(timezone.utc).isoformat())
                parsed = parse_time(expression, tz, ref)
                observation = parsed if parsed else "无法解析时间表达式"

                # Add to messages for next iteration
                assistant_content = f"{thought}\nAction: {action_name}\nAction Input: {json.dumps(action_input, ensure_ascii=False)}\nObservation: {observation}"
                messages.append({"role": "assistant", "content": assistant_content})
                continue  # Next step

            # Client-side tools: end stream and wait for client to continue
            else:
                assistant_content = f"{thought}\nAction: {action_name}\nAction Input: {json.dumps(action_input, ensure_ascii=False)}"
                messages.append({"role": "assistant", "content": assistant_content})
                yield _sse_event("done", {"traceId": trace_id, "needsContinuation": True})
                return

    # Max steps reached
    yield _sse_event("error", {"code": 10005, "message": "推理步骤过多，请简化请求"})
