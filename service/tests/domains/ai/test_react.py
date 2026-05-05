import pytest
from app.domains.ai.service import _parse_react_output


def test_parse_final_answer():
    text = """Thought: 用户想明天下午3点开会
Action: parse_time
Action Input: {"expression": "明天下午3点", "timezone": "Asia/Shanghai", "reference_time": "2026-05-04T10:00:00+08:00"}
Observation: 2026-05-05T15:00:00+08:00
Thought: 解析成功
Final Answer: {"action": "create_schedule", "params": {"title": "会议", "start_at": "2026-05-05T15:00:00+08:00"}, "confidence": 0.95}"""

    result = _parse_react_output(text)
    assert result["type"] == "final"
    assert result["command"]["action"] == "create_schedule"
    assert result["command"]["params"]["title"] == "会议"


def test_parse_action():
    text = """Thought: 用户想查询明天的会议
Action: query_schedule
Action Input: {"keyword": "会议", "start_date": "2026-05-05T00:00:00+08:00", "end_date": "2026-05-05T23:59:59+08:00"}"""

    result = _parse_react_output(text)
    assert result["type"] == "action"
    assert result["action"] == "query_schedule"
    assert result["action_input"]["keyword"] == "会议"


def test_parse_json_block_fallback():
    text = """Thinking about this...
```json
{"action": "chat", "params": {"response": "你好"}, "confidence": 1.0}
```"""

    result = _parse_react_output(text)
    assert result["type"] == "final"
    assert result["command"]["action"] == "chat"


def test_parse_xml_tool_call():
    text = """Thought: 需要解析时间
<tool_call name="parse_time">
<parameter name="expression" string="true">今天上午8:00</parameter>
<parameter name="timezone" string="true">Asia/Shanghai</parameter>
<parameter name="reference_time" string="true">2026-05-05T00:22:02+08:00</parameter>
</tool_call>"""

    result = _parse_react_output(text)
    assert result["type"] == "action"
    assert result["action"] == "parse_time"
    assert result["action_input"]["expression"] == "今天上午8:00"
    assert result["action_input"]["timezone"] == "Asia/Shanghai"


def test_parse_invoke_tool_call():
    """DeepSeek v4 outputs <invoke> instead of <tool_call>."""
    text = """<tool-calls>
<invoke name="query_schedule">
<parameter name="keyword" string="true">发布会</parameter>
<parameter name="start_date" string="true">2026-05-05T00:00:00+08:00</parameter>
<parameter name="end_date" string="true">2026-05-05T23:59:59+08:00</parameter>
</invoke>
<invoke name="parse_time">
<parameter name="expression" string="true">今天下午3:00</parameter>
<parameter name="timezone" string="true">Asia/Shanghai</parameter>
<parameter name="reference_time" string="true">2026-05-05T01:17:45+08:00</parameter>
</invoke>
</tool-calls>"""

    result = _parse_react_output(text)
    assert result["type"] == "action"
    assert result["action"] == "query_schedule"
    assert result["action_input"]["keyword"] == "发布会"
    assert result["action_input"]["start_date"] == "2026-05-05T00:00:00+08:00"


def test_parse_xml_tool_call_with_value_attr():
    """Some models put parameter value in 'value' attribute with empty tag body."""
    text = """Thought: 需要解析时间
<tool_call name="parse_time">
<parameter name="expression" value="今天下午4:00"></parameter>
<parameter name="timezone" value="Asia/Shanghai"></parameter>
<parameter name="reference_time" value="2026-05-05T10:00:00+08:00"></parameter>
</tool_call>"""

    result = _parse_react_output(text)
    assert result["type"] == "action"
    assert result["action"] == "parse_time"
    assert result["action_input"]["expression"] == "今天下午4:00"
    assert result["action_input"]["timezone"] == "Asia/Shanghai"


def test_parse_search_web_action():
    text = """Thought: 用户提到高铁行程，我需要先搜索相关信息
Action: search_web
Action Input: {"query": "上海到北京高铁时刻表 明天下午", "num_results": 3}"""

    result = _parse_react_output(text)
    assert result["type"] == "action"
    assert result["action"] == "search_web"
    assert result["action_input"]["query"] == "上海到北京高铁时刻表 明天下午"
    assert result["action_input"]["num_results"] == 3


def test_parse_empty_fallback():
    result = _parse_react_output("")
    assert result["type"] == "final"
    assert result["command"]["action"] == "chat"
