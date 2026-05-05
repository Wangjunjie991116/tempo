import asyncio
import json
import logging
import re
from datetime import datetime, timedelta, timezone
from typing import AsyncGenerator, Optional

from openai import AsyncOpenAI

from app.core.config import settings
from app.domains.ai.prompt_templates import SYSTEM_PROMPT
from app.domains.ai.schemas import AiChatRequest, AiCommand
from app.domains.ai.time_parser import parse_time
from app.domains.ai.web_search import search_web

logger = logging.getLogger(__name__)


_client: Optional[AsyncOpenAI] = None


def _get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        _client = AsyncOpenAI(base_url=settings.openai_base_url, api_key=settings.openai_api_key)
    return _client


TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "parse_time",
            "description": "Parse natural language time expressions like '明天下午3点'. Use this for ALL relative time references. Do NOT calculate time yourself.",
            "parameters": {
                "type": "object",
                "properties": {
                    "expression": {"type": "string", "description": "Natural language time expression, e.g. '明天下午3点'"},
                    "timezone": {"type": "string", "description": "User timezone, e.g. Asia/Shanghai"},
                    "reference_time": {"type": "string", "description": "ISO8601 datetime used as reference point"},
                },
                "required": ["expression", "timezone", "reference_time"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "query_schedule",
            "description": "Query/search existing schedule items. ALWAYS use this first before update or delete when the exact id is unknown.",
            "parameters": {
                "type": "object",
                "properties": {
                    "keyword": {"type": "string", "description": "Keyword to search in schedule titles"},
                    "start_date": {"type": "string", "description": "ISO8601 datetime (inclusive)"},
                    "end_date": {"type": "string", "description": "ISO8601 datetime (inclusive)"},
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "create_schedule",
            "description": "Create a new schedule item. Use when user mentions any future meeting, event, activity, plan, or schedule.",
            "parameters": {
                "type": "object",
                "properties": {
                    "title": {"type": "string"},
                    "start_at": {"type": "string", "description": "ISO8601 datetime with timezone offset"},
                    "end_at": {"type": "string", "description": "ISO8601 datetime with timezone offset"},
                    "tag": {"type": "string", "enum": ["design_review", "workshop", "brainstorm"]},
                    "all_day": {"type": "boolean"},
                    "attendee_count": {"type": "integer"},
                },
                "required": ["title", "start_at", "tag"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "update_schedule",
            "description": "Update an existing schedule item. ALWAYS call query_schedule first to obtain the exact id.",
            "parameters": {
                "type": "object",
                "properties": {
                    "id": {"type": "string", "description": "Schedule ID obtained from a prior query_schedule result"},
                    "title": {"type": "string"},
                    "start_at": {"type": "string", "description": "ISO8601 datetime with timezone offset"},
                    "end_at": {"type": "string", "description": "ISO8601 datetime with timezone offset"},
                    "tag": {"type": "string", "enum": ["design_review", "workshop", "brainstorm"]},
                    "status": {"type": "string", "enum": ["upcoming", "ongoing", "completed", "cancelled"]},
                    "attendee_count": {"type": "integer"},
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "delete_schedule",
            "description": "Delete a schedule item. ALWAYS call query_schedule first to obtain the exact id.",
            "parameters": {
                "type": "object",
                "properties": {
                    "id": {"type": "string", "description": "Schedule ID obtained from a prior query_schedule result"},
                },
                "required": ["id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "search_web",
            "description": "Search the web for real-time external information such as train/flight schedules, weather, events, venues, opening hours. Use this BEFORE asking the user for details they might not know.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Search query in Chinese or English"},
                    "num_results": {"type": "integer", "description": "Number of results (1-5)", "default": 3},
                },
                "required": ["query"],
            },
        },
    },
]


BACKEND_TOOLS = {"parse_time", "search_web"}
CLIENT_TRANSPARENT_TOOLS = {"query_schedule"}
FINAL_TOOLS = {"create_schedule", "update_schedule", "delete_schedule"}


def _build_system_prompt(request: AiChatRequest) -> str:
    now = datetime.now(timezone.utc).astimezone()
    tz = request.timezone or "UTC"
    locale = request.locale or "en"
    tags = request.context.get("availableTags", ["design_review", "workshop", "brainstorm"]) if request.context else ["design_review", "workshop", "brainstorm"]

    today = now.strftime("%Y-%m-%d")
    tomorrow = (now + timedelta(days=1)).strftime("%Y-%m-%d")
    next_monday = (now + timedelta(days=(7 - now.weekday()) % 7 or 7)).strftime("%Y-%m-%d")
    next_sunday = (now + timedelta(days=(7 - now.weekday()) % 7 or 7) + timedelta(days=6)).strftime("%Y-%m-%d")

    return (
        SYSTEM_PROMPT.replace("{current_time}", now.isoformat())
        .replace("{timezone}", tz)
        .replace("{locale}", locale)
        .replace("{available_tags}", ", ".join(tags))
        .replace("{today}", today)
        .replace("{tomorrow}", tomorrow)
        .replace("{next_monday}", next_monday)
        .replace("{next_sunday}", next_sunday)
    )


def _convert_message(m: dict) -> dict:
    """Convert an AiMessage dict to OpenAI-compatible message format."""
    msg: dict = {"role": m.get("role", "user"), "content": m.get("content", "")}
    tool_calls = m.get("tool_calls")
    if tool_calls:
        msg["tool_calls"] = [
            {
                "id": tc.get("id", ""),
                "type": tc.get("type", "function"),
                "function": {
                    "name": tc.get("function", {}).get("name", ""),
                    "arguments": tc.get("function", {}).get("arguments", ""),
                },
            }
            for tc in tool_calls
        ]
    if m.get("tool_call_id"):
        msg["tool_call_id"] = m["tool_call_id"]
    if m.get("name"):
        msg["name"] = m["name"]
    return msg


def _sse_event(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"


def _sse_ping() -> str:
    return ":ping\n\n"


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
    """Parse XML tool call format (<invoke> or <tool_call>) that some models output instead of ReAct.
    If multiple tools are present, only the first one is returned (ReAct is step-by-step).
    Returns {"type": "action", "thought": str, "action": str, "action_input": dict} or None.
    """
    # Try <invoke name="..."> first (DeepSeek v4 format)
    m = re.search(r"<invoke\s+name=\"(\w+)\"\s*>(.*?)</invoke>", text, re.DOTALL)
    if not m:
        # Fallback to <tool_call name="..."> format
        m = re.search(r"<tool_call\s+name=\"(\w+)\"\s*>(.*?)</tool_call>", text, re.DOTALL)
    if not m:
        return None

    action_name = m.group(1)
    inner = m.group(2)

    action_input: dict[str, str] = {}
    for param_m in re.finditer(r"<parameter\s+name=\"([^\"]+)\"([^>]*)/?>(.*?)</parameter>|"
        r"<parameter\s+name=\"([^\"]+)\"([^>]*)/?>", inner, re.DOTALL):
        key = param_m.group(1) or param_m.group(4)
        # Prefer value attribute over tag body
        attr_block = param_m.group(2) or param_m.group(5) or ""
        val_attr_m = re.search(r'value="([^"]*)"', attr_block)
        val = val_attr_m.group(1) if val_attr_m else (param_m.group(3) or "").strip()
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
    model = settings.openai_model

    logger.info("=== NEW REQUEST === trace_id=%s text=%s model=%s", trace_id, request.text, model)

    # Build messages
    if request.messages:
        messages = [_convert_message(m.model_dump()) for m in request.messages]
        # Ensure system prompt is first
        if not messages or messages[0]["role"] != "system":
            messages.insert(0, {"role": "system", "content": system_prompt})
    else:
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": request.text},
        ]

    logger.info("messages_count=%d", len(messages))

    max_steps = 5
    for step in range(max_steps):
        logger.info("react_step=%d/%d", step + 1, max_steps)

        # Stage
        if step == 0:
            yield _sse_event("stage", {"stage": "understanding", "label": "正在理解你的意图..."})
        else:
            yield _sse_event("stage", {"stage": "thinking", "label": "正在规划最佳安排..."})
        yield _sse_ping()  # flush headers immediately so client knows connection is alive

        # Call LLM with tools and concurrent heartbeat
        client = _get_client()

        try:
            logger.info("calling_llm start")
            stream = await client.chat.completions.create(
                model=model,
                messages=messages,
                tools=TOOLS,
                stream=True,
                temperature=0.3,
            )
            logger.info("calling_llm stream_created")
        except Exception as e:
            logger.error("llm_error: %s", e)
            yield _sse_event("error", {"code": 10003, "message": f"LLM service unavailable: {str(e)}"})
            return

        content_buffer = ""
        tool_calls: list[dict] = []
        chunk_count = 0
        stream_done = asyncio.Event()
        output_queue: asyncio.Queue[str | None] = asyncio.Queue()

        async def _consume_stream():
            nonlocal content_buffer, chunk_count
            try:
                async for chunk in stream:
                    chunk_count += 1
                    if not chunk.choices or len(chunk.choices) == 0:
                        continue
                    delta = chunk.choices[0].delta
                    finish_reason = chunk.choices[0].finish_reason

                    if delta and delta.content:
                        content_buffer += delta.content
                        await output_queue.put(_sse_event("thought", {"delta": delta.content}))

                    if delta and delta.tool_calls:
                        for tc_delta in delta.tool_calls:
                            idx = tc_delta.index
                            while len(tool_calls) <= idx:
                                tool_calls.append({"id": "", "type": "function", "function": {"name": "", "arguments": ""}})
                            if tc_delta.id:
                                tool_calls[idx]["id"] = tc_delta.id
                            if tc_delta.type:
                                tool_calls[idx]["type"] = tc_delta.type
                            if tc_delta.function:
                                if tc_delta.function.name:
                                    tool_calls[idx]["function"]["name"] = tc_delta.function.name
                                if tc_delta.function.arguments:
                                    tool_calls[idx]["function"]["arguments"] += tc_delta.function.arguments
                            # Defensive: some proxies send flattened tool call fields
                            if getattr(tc_delta, "name", None):
                                tool_calls[idx]["function"]["name"] = tc_delta.name
                            if getattr(tc_delta, "arguments", None):
                                tool_calls[idx]["function"]["arguments"] += tc_delta.arguments

                    if finish_reason == "tool_calls" or finish_reason == "stop":
                        break
            except Exception as e:
                logger.error("stream_error: %s", e)
                await output_queue.put(_sse_event("error", {"code": 10004, "message": f"流式传输中断: {str(e)}"}))
            finally:
                await output_queue.put(None)
                stream_done.set()

        async def _heartbeat():
            while not stream_done.is_set():
                try:
                    await asyncio.wait_for(stream_done.wait(), timeout=15.0)
                except asyncio.TimeoutError:
                    if not stream_done.is_set():
                        await output_queue.put(_sse_ping())

        consumer_task = asyncio.create_task(_consume_stream())
        heartbeat_task = asyncio.create_task(_heartbeat())

        try:
            while True:
                item = await output_queue.get()
                if item is None:
                    break
                yield item
        finally:
            stream_done.set()
            heartbeat_task.cancel()
            try:
                await heartbeat_task
            except asyncio.CancelledError:
                pass
            await consumer_task

        logger.info("stream_end chunks=%d content_length=%d tool_calls=%d", chunk_count, len(content_buffer), len(tool_calls))

        # Handle tool_calls
        valid_tool_calls = [tc for tc in tool_calls if tc.get("function", {}).get("name")]
        logger.info("valid_tool_calls count=%d names=%s", len(valid_tool_calls), [tc["function"]["name"] for tc in valid_tool_calls])

        # Defensive: log malformed or filtered tool_calls so we can diagnose provider issues
        malformed = [tc for tc in tool_calls if not tc.get("function", {}).get("name")]
        if malformed:
            logger.warning("malformed_tool_calls filtered=%d raw=%s", len(malformed), malformed)

        if valid_tool_calls:
            # Classify tool calls
            backend_calls: list[tuple[dict, dict]] = []
            transparent_calls: list[tuple[dict, dict]] = []
            final_calls: list[tuple[str, dict]] = []

            for tc in valid_tool_calls:
                name = tc["function"]["name"]
                try:
                    args = json.loads(tc["function"]["arguments"])
                except json.JSONDecodeError:
                    args = {}

                if name in BACKEND_TOOLS:
                    backend_calls.append((tc, args))
                elif name in CLIENT_TRANSPARENT_TOOLS:
                    transparent_calls.append((tc, args))
                elif name in FINAL_TOOLS:
                    final_calls.append((name, args))
                else:
                    logger.warning("unknown_tool_skipped: %s", name)

            # Build assistant message with all tool_calls for context
            assistant_msg = {
                "role": "assistant",
                "content": content_buffer or None,
                "tool_calls": [{
                    "id": tc["id"],
                    "type": tc["type"],
                    "function": {
                        "name": tc["function"]["name"],
                        "arguments": tc["function"]["arguments"],
                    },
                } for tc in valid_tool_calls],
            }
            messages.append(assistant_msg)

            # Execute backend tools internally
            for tc, args in backend_calls:
                if tc["function"]["name"] == "parse_time":
                    expression = args.get("expression", "")
                    tz = args.get("timezone", request.timezone or "UTC")
                    ref = args.get("reference_time", datetime.now(timezone.utc).isoformat())
                    parsed = parse_time(expression, tz, ref)
                    observation = parsed if parsed else "无法解析时间表达式"

                    messages.append({
                        "role": "tool",
                        "tool_call_id": tc["id"],
                        "content": observation,
                        "name": tc["function"]["name"],
                    })
                elif tc["function"]["name"] == "search_web":
                    query = args.get("query", "")
                    num_results = min(max(args.get("num_results", 3), 1), 5)
                    observation = search_web(query, num_results)
                    logger.info("search_web_observation query=%s length=%d preview=%s", query, len(observation), observation[:200])

                    # Defensive: prevent search loops by nudging the LLM if it keeps searching
                    search_count = sum(
                        1 for m in messages
                        if m.get("role") == "tool" and m.get("name") == "search_web"
                    )
                    if search_count >= 1:
                        observation += "\n\n（提示：你已经搜索过相关信息，请立即基于以上结果创建或更新日程，不要再继续搜索。）"

                    messages.append({
                        "role": "tool",
                        "tool_call_id": tc["id"],
                        "content": observation,
                        "name": tc["function"]["name"],
                    })

            # If there are backend calls mixed with other calls, provide placeholder
            # responses for the non-backend calls so conversation history stays valid,
            # then continue to the next step.
            if backend_calls and (transparent_calls or final_calls):
                for tc, _args in (transparent_calls + final_calls):
                    messages.append({
                        "role": "tool",
                        "tool_call_id": tc["id"],
                        "content": "此操作将在下一步执行",
                        "name": tc["function"]["name"],
                    })
                continue  # Next step

            if backend_calls:
                continue  # Next step

            # Client-side transparent tool: end stream and wait for client to continue
            if transparent_calls:
                tc, args = transparent_calls[0]
                yield _sse_event("action", {"tool": tc["function"]["name"], "params": args})
                yield _sse_event("done", {"traceId": trace_id, "needsContinuation": True})
                return

            # Final tools: wrap as commands
            if final_calls:
                if len(final_calls) == 1:
                    name, args = final_calls[0]
                    cmd = AiCommand(action=name, params=args, confidence=0.95)
                    logger.info("final_command: %s", cmd.model_dump())
                    yield _sse_event("stage", {"stage": "confirming", "label": "准备执行操作..."})
                    yield _sse_event("final", {"command": cmd.model_dump()})
                else:
                    commands = [
                        AiCommand(action=name, params=args, confidence=0.95).model_dump()
                        for name, args in final_calls
                    ]
                    logger.info("final_commands count=%d", len(commands))
                    yield _sse_event("stage", {"stage": "confirming", "label": "准备执行操作..."})
                    yield _sse_event("final", {"commands": commands})

                yield _sse_event("done", {"traceId": trace_id, "needsContinuation": False})
                return

        # Fallback: try to parse content_buffer as ReAct / JSON
        if content_buffer:
            result = _parse_react_output(content_buffer)
            logger.info("fallback_parse type=%s thought_preview=%s", result["type"], result.get("thought", "")[:200])

            if result["type"] == "final":
                command = result.get("command", {})
                action = command.get("action", "chat")
                params = command.get("params", {})
                confidence = float(command.get("confidence", 0.9))
                cmd = AiCommand(action=action, params=params, confidence=confidence)
                logger.info("final_command: %s", cmd.model_dump())

                yield _sse_event("stage", {"stage": "confirming", "label": "准备执行操作..."})
                yield _sse_event("final", {"command": cmd.model_dump()})
                yield _sse_event("done", {"traceId": trace_id, "needsContinuation": False})
                return

            elif result["type"] == "action":
                action_name = result["action"]
                action_input = result.get("action_input", {})
                thought = result.get("thought", "")

                yield _sse_event("action", {"tool": action_name, "params": action_input})

                if action_name == "parse_time":
                    expression = action_input.get("expression", "")
                    tz = action_input.get("timezone", request.timezone or "UTC")
                    ref = action_input.get("reference_time", datetime.now(timezone.utc).isoformat())
                    parsed = parse_time(expression, tz, ref)
                    observation = parsed if parsed else "无法解析时间表达式"

                    assistant_content = f"{thought}\nAction: {action_name}\nAction Input: {json.dumps(action_input, ensure_ascii=False)}\nObservation: {observation}"
                    messages.append({"role": "assistant", "content": assistant_content})
                    continue
                elif action_name == "search_web":
                    query = action_input.get("query", "")
                    num_results = min(max(action_input.get("num_results", 3), 1), 5)
                    observation = search_web(query, num_results)

                    assistant_content = f"{thought}\nAction: {action_name}\nAction Input: {json.dumps(action_input, ensure_ascii=False)}\nObservation: {observation}"
                    messages.append({"role": "assistant", "content": assistant_content})
                    continue
                else:
                    assistant_content = f"{thought}\nAction: {action_name}\nAction Input: {json.dumps(action_input, ensure_ascii=False)}"
                    messages.append({"role": "assistant", "content": assistant_content})
                    yield _sse_event("done", {"traceId": trace_id, "needsContinuation": True})
                    return

        # Complete fallback
        if tool_calls and not content_buffer:
            fallback_text = "抱歉，我在理解您的请求时遇到了问题，请再试一次或换一种方式描述。"
        else:
            fallback_text = content_buffer or "有什么可以帮你的吗？"
        command = {
            "action": "chat",
            "params": {"response": fallback_text},
            "confidence": 1.0,
        }
        logger.info("final_command: %s", command)

        yield _sse_event("stage", {"stage": "confirming", "label": "准备执行操作..."})
        yield _sse_event("final", {"command": command})
        yield _sse_event("done", {"traceId": trace_id, "needsContinuation": False})
        return

    # Max steps reached
    yield _sse_event("error", {"code": 10005, "message": "推理步骤过多，请简化请求"})
