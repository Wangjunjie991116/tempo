# Tempo AI 意图理解 ReAct 架构设计

## 概述

当前 Tempo 的 AI 助手采用「单轮 Prompt-based JSON」模式：后端调用一次 LLM，输出一个结构化 command，客户端执行。该模式在以下四个维度存在系统性瓶颈：

- **A. 稳定性**：同样的话术，模型有时解析对、有时解析错，结果不可预期
- **B. 多轮能力**：需要先查询再决定下一步（如先查有哪些会议，再选其中一个修改），单轮命令模式走不通
- **C. 复杂意图拆解**：用户一句话里包含多个操作，模型只能输出一个 command
- **D. 时间解析**：相对时间、时区、模糊表达的解析经常出错，依赖模型「口算」

本设计引入 **ReAct（Reasoning + Acting）** 架构，将后端变为无状态推理引擎，由客户端驱动多轮循环，同时用确定性代码接管时间解析。

---

## 1. 架构概述

### 1.1 核心思路：客户端驱动的无状态多轮 ReAct

当前架构最大的约束是「数据在客户端本地」（AsyncStorage），后端无法直接查询。因此 ReAct 循环不能全放在后端，而是采用**客户端驱动**模式：

- **后端**：纯无状态。接收 `messages`（完整对话历史），调用 LLM 生成下一步 `Thought + Action`。如果是后端工具（如时间解析），直接执行；如果是客户端工具（如 `query_schedule`），通过 SSE 下发 `action` 事件后结束流。
- **客户端**：持有 `messages` 状态。收到 `action` 后执行工具，把 `Observation` 拼进 `messages`，再次发起 POST，驱动下一轮。
- **任意多轮**：理论上可以支持「查询 → 比较 → 更新 → 确认」任意步骤。

### 1.2 相对当前架构的变更点

| 维度 | 当前 | 新架构 |
|------|------|--------|
| 对话上下文 | 无，每次只有单条 `text` | `messages` 数组，多轮累积 |
| LLM 角色 | 一次输出一个 JSON command | 输出 Thought → Action → 可能继续 |
| 时间解析 | 模型口算 | 后端 `dateparser` 确定性解析 |
| 复杂意图 | 只能输出一个 action | 支持多步骤拆解 |
| SSE 事件 | `stage` / `thought` / `command` / `done` / `error` | 新增 `action` / `final` |

### 1.3 关键决策

1. **后端完全无状态，不保存会话**。上下文靠客户端传 `messages`。
2. **后端工具（时间解析）在同一次请求内完成**，不暴露给客户端，不增加额外延迟。
3. **客户端工具（CRUD）通过 `action` 事件暴露**，客户端执行后回传 `Observation`。
4. **推理受阻时主动提问**：LLM 遇到歧义、信息不足或多匹配项时，输出 `chat` action 请求用户澄清，而非强行猜测。

---

## 2. 后端 ReAct 引擎

### 2.1 ReAct Prompt 格式

System prompt 改为标准 ReAct 格式，明确告诉模型可用工具和输出规范：

```text
You are Tempo, a smart schedule management assistant.
Current time: {current_time}
User timezone: {timezone}
Available tags: {available_tags}

You have access to the following tools:
- query_schedule: Query local schedule items
- create_schedule: Create a new schedule item
- update_schedule: Update an existing schedule item (supports query_hint when id is unknown)
- delete_schedule: Delete a schedule item (supports query_hint when id is unknown)
- parse_time: Parse natural language time expressions into ISO8601 (BACKEND ONLY, you can use this in reasoning)

Use this format:
Thought: your reasoning about what to do next
Action: tool_name
Action Input: {"param": "value"}

If you have completed the task, use:
Thought: your reasoning
Final Answer: {"action": "create_schedule|update_schedule|delete_schedule|query_schedule|chat", "params": {...}, "confidence": 0.x}
```

**关键约束：**
- 模型不允许自己口算时间。遇到时间表达必须调用 `parse_time`（后端自动处理，不增加客户端延迟）。
- `Final Answer` 中如果是 `update_schedule` / `delete_schedule`，优先用 `query_hint` 而非硬编码 id。
- 当信息不足、歧义或多匹配项时，输出 `chat` 请求用户澄清。

### 2.2 请求体扩展

```json
POST /api/v1/ai/chat
{
  "text": "帮我把设计评审会改到9:30",
  "timezone": "Asia/Shanghai",
  "locale": "zh-CN",
  "context": {
    "currentTime": "2026-05-04T10:00:00+08:00",
    "availableTags": ["design_review", "workshop", "brainstorm"]
  },
  "messages": [
    {"role": "system", "content": "..."},
    {"role": "user", "content": "帮我把设计评审会改到9:30"},
    {"role": "assistant", "content": "Thought: ...\nAction: query_schedule\nAction Input: {...}\nObservation: 找到日程：设计评审会（20:00-21:00）"}
  ]
}
```

- **首次请求**：`messages` 为空，后端自动构造 `[system, user]`。
- **续轮请求**：客户端把前一轮的 `Thought + Action + Observation` 作为 `assistant` message 拼入 `messages`。

### 2.3 后端内部工具（时间解析）

在 `ai_orchestrator.py` 中增加确定性时间解析：

```python
import dateparser
from datetime import datetime

def parse_time(expression: str, timezone: str, reference_time: str) -> str | None:
    settings = {
        "RELATIVE_BASE": datetime.fromisoformat(reference_time),
        "TIMEZONE": timezone,
        "RETURN_AS_TIMEZONE_AWARE": True,
        "PREFER_DATES_FROM": "future",
    }
    dt = dateparser.parse(expression, settings=settings)
    return dt.isoformat() if dt else None
```

**执行时机：** 后端在解析 LLM 输出时，如果检测到 `Action: parse_time`，直接执行，把 `Observation` 写回 messages，然后再次调用 LLM（同一次请求内完成，用户无感知）。

### 2.4 SSE 事件扩展

| event | 触发时机 | payload |
|-------|---------|---------|
| `stage` | 阶段切换（保留） | `{"stage": "...", "label": "..."}` |
| `thought` | LLM 输出 reasoning | `{"delta": "..."}` |
| `action` | LLM 需要客户端执行工具 | `{"tool": "query_schedule", "params": {...}}` |
| `final` | LLM 输出 Final Answer | `{"command": {"action": "...", "params": {...}, "confidence": ...}}` |
| `done` | 本轮流结束 | `{"traceId": "...", "needsContinuation": true/false}` |
| `error` | 出错 | `{"code": ..., "message": "..."}` |

`needsContinuation: true` 表示客户端执行完 `action` 后需要再次发起请求；`false` 表示流程结束。

### 2.5 循环控制

防止模型无限循环或过度思考：
- **`max_steps = 5`**：单轮请求内最多 5 次 Thought/Action 迭代
- **`max_total_rounds = 3`**：客户端最多续轮 2 次（即总共 3 轮 SSE 流）

---

## 3. 客户端状态机与多轮循环

### 3.1 `useAiChat` 核心变更

引入 `messagesHistory` 状态，保存与后端对齐的 OpenAI 格式消息列表：

```typescript
type ChatMessage = ...; // 现有 UI 消息（保留）
type AiMessage = { role: "system" | "user" | "assistant"; content: string };

export function useAiChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [aiMessages, setAiMessages] = useState<AiMessage[]>([]); // 给后端的上下文
  const [state, setState] = useState<AiChatState>("idle");
  const [roundCount, setRoundCount] = useState(0);
  // ...
}
```

### 3.2 发送请求时构造 `messages`

**首次请求：**
```typescript
const systemPrompt = buildSystemPrompt(request);
const messages: AiMessage[] = [
  { role: "system", content: systemPrompt },
  { role: "user", content: text.trim() },
];
```

**续轮请求（收到 `action` 后）：**
```typescript
const assistantContent = `Thought: ${lastThought}\nAction: ${lastAction}\nAction Input: ${JSON.stringify(lastActionInput)}`;
const newMessages = [
  ...aiMessages,
  { role: "assistant", content: assistantContent },
  { role: "user", content: `Observation: ${observationResult}` },
];
```

### 3.3 执行 `action` 并构造 `Observation`

`action` 事件到达时，客户端在 `executeAction` 中处理：

```typescript
async function executeAction(tool: string, params: Record<string, unknown>): Promise<string> {
  switch (tool) {
    case "query_schedule": {
      const items = await findScheduleItems({
        keyword: params.keyword as string,
        startAt: params.start_date ? Date.parse(params.start_date as string) : undefined,
        endAt: params.end_date ? Date.parse(params.end_date as string) : undefined,
      });
      return items.length === 0
        ? "没有找到匹配的日程。"
        : items.map(i => `${i.title} (${new Date(i.startAt).toLocaleString("zh-CN")})`).join("\n");
    }
    // create_schedule / update_schedule / delete_schedule 同理
    default: return `未知工具：${tool}`;
  }
}
```

### 3.4 多轮循环驱动

```typescript
// 收到 done 事件后
if (needsContinuation && collectedAction) {
  const observation = await executeAction(collectedAction.tool, collectedAction.params);

  if (roundCount >= 2) {
    Toast.show({ type: "error", text1: "操作过于复杂，请分步说明" });
    setState("error");
    return;
  }

  setRoundCount(prev => prev + 1);
  // 构造新 messages 并再次请求
} else if (collectedCommand) {
  const result = await executeCommand(collectedCommand, msgId);
  // ...
}
```

### 3.5 UX 衔接

- **Round 1**：正常展示 `understanding → analyzing → thinking`
- **Round 2+**：跳过 `understanding`，直接从 `analyzing` 或 `thinking` 开始（后端控制）
- 每一轮的 `thought` 增量追加到同一个 assistant bubble 中
- `action` 执行时，在 bubble 内展示小标签："正在查询日程..."

---

## 4. 典型数据流示例

### 4.1 单步创建（无多轮）

```
用户: "明天下午3点开评审会"

Round 1:
  客户端 POST: {text, messages: [system, user]}
  后端 → SSE:
    stage: understanding
    thought: "用户想创建一个明天的日程..."
    final: {command: {action: "create_schedule", params: {...}, confidence: 0.95}}
    done: {needsContinuation: false}
  客户端: 收到 command → executeCommand → 创建成功
```

### 4.2 先查后改（多轮）

```
用户: "把设计评审会改到9:30"

Round 1:
  后端 → SSE:
    thought: "用户想修改设计评审会的时间..."
    action: {tool: "query_schedule", params: {keyword: "设计评审会"}}
    done: {needsContinuation: true}

  客户端: 执行 query_schedule → 找到 1 条
  Observation: "设计评审会（2026-05-04 20:00-21:00）"

Round 2:
  后端 → SSE:
    thought: "根据查询结果，我要更新该日程的结束时间到21:30..."
    final: {command: {action: "update_schedule", params: {query_hint: "设计评审会", end_at: "..."}, confidence: 0.93}}
    done: {needsContinuation: false}

  客户端: 收到 command → executeCommand → 更新成功
```

### 4.3 一句话多操作（多轮 + 歧义澄清）

```
用户: "把明天的会议改到后天，同时取消后天的培训"

Round 1:
  后端推理：需要两步。先处理"把明天的会议改到后天"。
  action: query_schedule({keyword: "会议", start_date: "明天00:00", end_date: "明天23:59"})
  done: needsContinuation: true

Round 2:
  客户端回传 Observation（找到 2 条会议）
  后端推理：找到多个会议，需要用户确认。
  final: {command: {action: "chat", params: {response: "找到多个明天的会议：\n1. 产品评审会 ...\n2. 周会 ...\n请告诉我要修改哪一个？"}, confidence: 1.0}}
  done: {needsContinuation: false}

  客户端: 展示给用户，等待用户回复
```

### 4.4 时间解析（后端内部工具）

```
用户: "后天上午的设计评审会"

Round 1:
  后端 LLM 输出：
    thought: "用户提到了'后天上午'，我需要先解析这个时间..."
    Action: parse_time
    Action Input: {expression: "后天上午", timezone: "Asia/Shanghai"}

  后端内部执行 parse_time → "2026-05-06T09:00:00+08:00"
  后端把 Observation 写回 messages，再次调 LLM（同一次 SSE 流内，用户无感知）

  LLM 继续输出：
    thought: "解析结果是2026-05-06上午9点..."
    final: {command: {action: "create_schedule", ...}}
    done: {needsContinuation: false}
```

---

## 5. 时间解析工具化

### 5.1 问题根源

当前模型自己口算时间。模型偶尔会：
- 时区搞错（输出 UTC 而非本地时区）
- 日期边界搞错（"后天"算成明天）
- 格式不标准（漏了时区偏移或秒数）

### 5.2 方案：后端 `dateparser` + ReAct 工具调用

**后端新增 `parse_time` 工具：**

```python
import dateparser
from datetime import datetime

def parse_time(expression: str, timezone: str, reference_time: str) -> str | None:
    settings = {
        "RELATIVE_BASE": datetime.fromisoformat(reference_time),
        "TIMEZONE": timezone,
        "RETURN_AS_TIMEZONE_AWARE": True,
        "PREFER_DATES_FROM": "future",
    }
    dt = dateparser.parse(expression, settings=settings)
    return dt.isoformat() if dt else None
```

**支持的表达：**
- "今天晚上9:30" → `2026-05-04T21:30:00+08:00`
- "后天上午" → `2026-05-06T09:00:00+08:00`
- "下周三下午3点" → 正确计算
- "5月10号" → `2026-05-10T00:00:00+08:00`

**执行时机：**
- LLM 在 thinking 中输出 `Action: parse_time`
- 后端**同一次请求内**直接执行，得到 `Observation`
- 把 `Observation` 写回 messages，再次调 LLM
- 用户看到的仍然是连续的 `thought` 流，无感知

### 5.3 Prompt 中对时间的约束

System prompt 中明确加入：

```text
## Time Handling Rules
- When you see a time expression in user's text (e.g. "今天晚上9:30", "后天上午"), you MUST use the parse_time tool. Do NOT calculate time yourself.
- The parse_time tool returns ISO8601 with timezone offset. Use that exact value in your Final Answer.
- If the user's time expression is ambiguous (e.g. "3点" without AM/PM), use your best judgment or ask for clarification.
```

### 5.4 Fallback

如果 `dateparser` 返回 `None`（无法解析）：
- 后端把 `Observation: "无法解析时间表达式"` 写回 messages
- LLM 收到后，可以选择向用户请求澄清（`action: chat`）或使用默认值

---

## 附录：SSE 事件协议完整定义

```typescript
type SseEvent =
  | { event: "stage"; data: { stage: string; label: string } }
  | { event: "thought"; data: { delta: string } }
  | { event: "action"; data: { tool: string; params: Record<string, unknown> } }
  | { event: "final"; data: { command: AiCommand } }
  | { event: "done"; data: { traceId: string; needsContinuation: boolean } }
  | { event: "error"; data: { code: number; message: string } };
```

---

*设计日期：2026-05-04*
*状态：待实施*
