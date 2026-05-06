# AI 对话中断与取消标记设计

## 概述

允许用户在 AI 正在输出回答时主动中断，并在被中断的用户消息上显示灰色"（取消）"标记。被中断的对话内容不会进入后续对话的上下文。

## 需求

1. AI 在 `sending` / `streaming` 状态时，麦克风按钮变为红色双竖条图标，提示文案变为"点击取消"
2. 用户点击取消后，立即中断 SSE 流，停止接收 AI 输出
3. 被中断的用户提问保留在对话框中，其下方显示灰色小字"（取消）"
4. 已流式输出的思考过程（thinking 气泡）保留在对话框中，不删除
5. 后续新的用户提问在与后端交互时，`aiMessages` 中不携带本次被取消的对话内容

## 方案

采用**最小改动方案（方案 A）**：

- `ChatMessage.user` 新增可选字段 `cancelled?: boolean`
- `useAiChat` 每轮开始时保存 `aiMessages` 快照，取消时回滚快照
- `AiFloatingAssistant` 根据 `state` 切换麦克风/取消按钮的 UI 与交互

## 数据模型变更

### `app/modules/ai/types.ts`

```ts
export type ChatMessage =
  | { id: string; role: "user"; type: "user"; text: string; cancelled?: boolean }
  | /* ... 其他类型不变 ... */
```

仅在 `user` 分支增加 `cancelled?: boolean`，对其他消息类型零影响。

## 状态管理（`useAiChat.ts`）

### 新增 Ref

```ts
const roundStartAiMessagesRef = useRef<AiMessage[]>([]);
const roundStartMessagesLengthRef = useRef<number>(0);
```

- `roundStartAiMessagesRef`：本轮 `processRound` 开始前 `aiMessages` 的快照
- `roundStartMessagesLengthRef`：本轮开始前 `messages` 数组的长度，用于定位本轮用户消息

### 保存快照

在 `processRound` 函数最开头（`if (!isContinuation)` 块之前）：

```ts
roundStartAiMessagesRef.current = [...currentAiMessages];
roundStartMessagesLengthRef.current = messages.length;
```

快照在**最外层调用**（`isContinuation = false`）时保存一次。continuation 轮次（ReAct 多轮循环）不独立保存，取消时统一回滚到最初用户问题开始前的状态。

### 中断函数 `abortResponse`

```ts
const abortResponse = useCallback(() => {
  // 1. 中止 SSE 流
  if (abortRef.current) {
    abortRef.current();
    abortRef.current = null;
  }
  // 2. 回滚 aiMessages
  setAiMessages(roundStartAiMessagesRef.current);
  // 3. 标记本轮用户消息为 cancelled
  setMessages((prev) =>
    prev.map((m, idx) =>
      idx === roundStartMessagesLengthRef.current - 1 && m.type === "user"
        ? { ...m, cancelled: true }
        : m
    )
  );
  setState("idle");
}, []);
```

### 消息追加逻辑调整

原逻辑在 `processRound` 收到最终 result 时，用 `prev.map` **替换** thinking 消息。改为**追加**新消息，使 thinking 气泡永久保留：

- `final` / `command` 事件：不再 patch thinking 消息，仅记录 `collectedCommand`
- `confidence < 0.7` 或 `create_schedule`：追加新的 `command` 消息
- 自动执行完成：追加新的 `text` 消息
- fallback：追加新的 `text` 消息
- 异常 catch：追加新的 `error` 消息

## UI 交互（`AiFloatingAssistant.tsx`）

### 按钮状态切换

| 状态 | 图标 | 文案 | 交互 |
|------|------|------|------|
| `idle` / `done` / `error` / `confirming` | 麦克风 | `ai:holdToSpeak` | `onPressIn={startHold}` / `onPressOut={finalizeUtterance}` |
| `sending` / `streaming` | 红色双竖条 | "点击取消" | `onPress={abortResponse}` |
| `executing` | 麦克风（disabled） | "AI 处理中..." | disabled |

`executing` 状态不显示取消按钮，因为该阶段执行的是本地 AsyncStorage 写操作，速度快且不可中断；显示取消按钮会导致"UI 显示取消但数据已写入"的认知冲突。

### 用户消息"（取消）"标记

在 `renderMessage` 中，当 `m.role === "user"` 且 `m.cancelled === true` 时，在用户气泡下方渲染：

```tsx
{m.cancelled && (
  <Text style={[styles.cancelledLabel, { color: t.textMuted }]}>
    （取消）
  </Text>
)}
```

样式：

```ts
cancelledLabel: {
  fontFamily: "Manrope_400Regular",
  fontSize: 12,
  marginTop: 4,
  marginLeft: 14,
  opacity: 0.5,
}
```

## 边界情况

### 用户在 `sending` 状态取消（尚未收到任何 SSE event）

- `aiMessages` 快照里只有历史消息，回滚无实际变更
- 用户消息标记 `cancelled: true`
- 对话框中仅显示用户问题 + "（取消）"，AI 无任何输出

### 用户在 `streaming` 状态取消（AI 已输出部分 thoughts）

- 已显示的 thinking 气泡保留
- `aiMessages` 回滚到本轮开始前的状态
- 用户消息标记 `cancelled: true`
- 后续新提问不携带被中断的上下文

### 多轮 ReAct continuation 过程中取消

- 快照只在最外层 `isContinuation = false` 时保存
- 取消时回滚到最初用户问题开始前的状态
- 一并清除第一轮产生的 assistant/tool 消息，避免后续对话携带残缺上下文

## 不涉及的范围

- **语音转文字手势交互**（微信式左滑取消、右上滑转文字）：属于独立的 change 1，不在本文档范围内
- **对话持久化与 72h TTL**：该需求已取消，对话仍仅在内存中保留
- **清空历史按钮**：该需求已取消
