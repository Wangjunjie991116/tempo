# AI 对话中断与取消标记 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 允许用户在 AI 输出回答时点击取消按钮中断 SSE 流，被中断的用户消息显示"（取消）"标记，且该对话内容不进入后续上下文。

**Architecture:** 在 `useAiChat` 中保存每轮开始前的 `aiMessages` 快照，取消时回滚快照并标记用户消息；`AiFloatingAssistant` 根据 `state` 在麦克风/取消按钮间切换 UI。

**Tech Stack:** React Native, Expo, TypeScript, react-native-svg

---

## 文件结构

| 文件 | 动作 | 职责 |
|------|------|------|
| `app/modules/ai/types.ts` | 修改 | `ChatMessage.user` 增加 `cancelled?: boolean` |
| `app/modules/ai/hooks/useAiChat.ts` | 修改 | 快照保存、回滚、`abortResponse`、统一 `executeAction` 删除语义 |
| `app/modules/ai/components/AiFloatingAssistant.tsx` | 修改 | 取消按钮 UI、暂停图标、用户消息 cancelled 标记渲染 |

---

## Task 1: 数据模型 — `types.ts` 添加 `cancelled` 字段

**Files:**
- Modify: `app/modules/ai/types.ts:55`

- [ ] **Step 1: 修改 `ChatMessage` 的 `user` 分支**

```ts
export type ChatMessage =
  | { id: string; role: "user"; type: "user"; text: string; cancelled?: boolean }
  | {
      id: string;
      role: "assistant";
      type: "thinking";
      stages: AiStageLabel[];
      thoughts: string;
      command?: AiCommand;
    }
  | {
      id: string;
      role: "assistant";
      type: "command";
      command: AiCommand;
      commands?: AiCommand[];
      confirmed: boolean;
    }
  | { id: string; role: "assistant"; type: "text"; text: string }
  | { id: string; role: "assistant"; type: "error"; text: string };
```

- [ ] **Step 2: TypeScript 类型检查**

Run: `cd /Users/wangjunjie/Documents/Work/Personal/tempo/app && pnpm exec tsc --noEmit --skipLibCheck`
Expected: 无错误

- [ ] **Step 3: Commit**

```bash
git add app/modules/ai/types.ts
git commit -m "feat(ai): add cancelled flag to user chat message type"
```

---

## Task 2: `useAiChat.ts` — 快照机制与 `abortResponse`

**Files:**
- Modify: `app/modules/ai/hooks/useAiChat.ts:55-59`, `295-300`, `373-401`, `534-548`, `583-596`

当前代码状态确认：
- `executeCommand` 中的 `delete_schedule` 已使用 `deleted` 返回模式
- `executeAction` 中的 `delete_schedule` 仍使用旧 `ok` 模式，需要同步
- `processRound` 中的消息追加逻辑（append 而非 replace）已实现
- `final` / `command` 事件不再 patch thinking 消息

- [ ] **Step 1: 添加快照 Refs**

在 `app/modules/ai/hooks/useAiChat.ts` 的 `seqRef` / `abortRef` 下方添加：

```ts
  const seqRef = useRef(0);
  const abortRef = useRef<(() => void) | null>(null);
  const roundStartAiMessagesRef = useRef<AiMessage[]>([]);
  const roundStartMessagesLengthRef = useRef<number>(0);
```

- [ ] **Step 2: 添加 `abortResponse` 函数**

在 `resetState` 函数之后、`executeCommand` 之前插入：

```ts
  const abortResponse = useCallback(() => {
    if (abortRef.current) {
      abortRef.current();
      abortRef.current = null;
    }
    setAiMessages(roundStartAiMessagesRef.current);
    setMessages((prev) =>
      prev.map((m, idx) =>
        idx === roundStartMessagesLengthRef.current - 1 && m.type === "user"
          ? { ...m, cancelled: true }
          : m,
      ),
    );
    setState("idle");
  }, []);
```

- [ ] **Step 3: 在 `processRound` 开头保存快照**

在 `processRound` 函数体最开头、`if (!isContinuation)` 之前添加：

```ts
  async function processRound(
    text: string,
    currentAiMessages: AiMessage[],
    assistantMsgId: string,
    currentRound: number,
    isContinuation: boolean,
  ) {
    roundStartAiMessagesRef.current = [...currentAiMessages];
    roundStartMessagesLengthRef.current = messages.length;

    if (!isContinuation) {
```

- [ ] **Step 4: 统一 `executeAction` 中的 `delete_schedule` 语义**

将 `executeAction` 中 `case "delete_schedule":` 段（约第 268-289 行）替换为：

```ts
      case "delete_schedule": {
        let id = params.id as string | undefined;
        if (!id && params.query_hint) {
          const matches = await findScheduleItems({
            keyword: params.query_hint as string,
          });
          if (matches.length === 0) {
            return `删除失败：未找到与 "${params.query_hint}" 匹配的日程。`;
          }
          if (matches.length > 1) {
            return `找到多个匹配日程，请提供更精确的描述：\n${formatScheduleResult(matches)}`;
          }
          id = matches[0].id;
        }
        if (!id) {
          return "删除失败：缺少日程 ID 或定位描述。";
        }
        const deleted = await deleteScheduleItem(id);
        return deleted
          ? `✅已删除日程：${deleted.title}`
          : `删除失败：找不到 ID 为 ${id} 的日程。`;
      }
```

- [ ] **Step 5: 在 `useAiChat` 返回值中暴露 `abortResponse`**

在文件末尾的 return 对象中加入 `abortResponse`：

```ts
  return {
    messages,
    state,
    currentStage,
    pendingCommand,
    sendMessage,
    confirmCommand,
    cancelCommand,
    clearMessages,
    abortResponse,
  };
```

- [ ] **Step 6: TypeScript 类型检查**

Run: `cd /Users/wangjunjie/Documents/Work/Personal/tempo/app && pnpm exec tsc --noEmit --skipLibCheck`
Expected: 无错误

- [ ] **Step 7: Commit**

```bash
git add app/modules/ai/hooks/useAiChat.ts
git commit -m "feat(ai): add abortResponse with snapshot rollback and cancelled marking"
```

---

## Task 3: `AiFloatingAssistant.tsx` — 取消按钮 UI 与用户消息标记

**Files:**
- Modify: `app/modules/ai/components/AiFloatingAssistant.tsx:395-397`, `647-648`, `650-661`, `798-807`, `829-854`

- [ ] **Step 1: 从 `useAiChat` 解构 `abortResponse`**

将：
```ts
  const { messages, state, sendMessage, confirmCommand, cancelCommand } =
    useAiChat();
```
改为：
```ts
  const { messages, state, sendMessage, confirmCommand, cancelCommand, abortResponse } =
    useAiChat();
```

- [ ] **Step 2: 修改 `renderMessage` 中的用户消息渲染，添加 cancelled 标记**

将 `renderMessage` 中 `m.role === "user"` 分支替换为：

```tsx
    if (m.role === "user") {
      return (
        <View key={m.id} style={[styles.bubbleRow, styles.bubbleRowUser]}>
          <View>
            <View style={[styles.bubble, { backgroundColor: t.brand }]}>
              <Text style={[styles.bubbleText, { color: t.surfaceElevated }]}>
                {m.text}
              </Text>
            </View>
            {m.cancelled && (
              <Text style={[styles.cancelledLabel, { color: t.textMuted }]}>
                （取消）
              </Text>
            )}
          </View>
        </View>
      );
    }
```

- [ ] **Step 3: 修改麦克风按钮为状态感知的取消/录音按钮**

将 `isAiActive` 计算和按钮区域替换。先修改 `isAiActive` 定义（约第 647-648 行）：

```tsx
  const isAiResponding = state === "sending" || state === "streaming";
  const isAiActive =
    state === "sending" || state === "streaming" || state === "executing";
```

然后修改 `holdHint` 文案（约第 801-806 行）：

```tsx
              <Text style={[styles.holdHint, { color: palette.muted }]}>
                {holding
                  ? tr("ai:holdListening")
                  : isAiResponding
                    ? "点击取消"
                    : state === "executing"
                      ? "AI 处理中..."
                      : tr("ai:holdToSpeak")}
              </Text>
```

最后将麦克风 `Pressable`（约第 829-854 行）替换为：

```tsx
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  isAiResponding ? "取消 AI 回答" : tr("ai:voiceButtonA11y")
                }
                onPressIn={isAiResponding ? undefined : startHold}
                onPressOut={isAiResponding ? undefined : finalizeUtterance}
                onPress={isAiResponding ? abortResponse : undefined}
                style={({ pressed }) => [
                  styles.micOuter,
                  {
                    borderColor: holding
                      ? t.brand
                      : isAiResponding
                        ? "#ef4444"
                        : palette.line,
                    backgroundColor: holding
                      ? t.brandSelectedHighlight
                      : t.surfaceElevated,
                    transform: [{ scale: pressed || holding ? 1.04 : 1 }],
                  },
                ]}
              >
                {isAiResponding ? (
                  <Svg width={28} height={28} viewBox="0 0 24 24">
                    <Path
                      d="M6 4h4v16H6zm8 0h4v16h-4z"
                      fill="#ef4444"
                    />
                  </Svg>
                ) : (
                  <Svg width={28} height={28} viewBox="0 0 24 24">
                    <Path
                      d="M12 14a3 3 0 0 0 3-3V7a3 3 0 0 0-6 0v4a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V20H9v2h6v-2h-2v-2.08A7 7 0 0 0 19 11h-2z"
                      fill={t.brand}
                    />
                  </Svg>
                )}
              </Pressable>
```

- [ ] **Step 4: 在 `StyleSheet.create` 末尾添加 `cancelledLabel` 样式**

在 `styles` 对象末尾（`micOuter` 之后）添加：

```ts
  cancelledLabel: {
    fontFamily: "Manrope_400Regular",
    fontSize: 12,
    marginTop: 4,
    marginLeft: 14,
    opacity: 0.5,
  },
```

- [ ] **Step 5: TypeScript 类型检查**

Run: `cd /Users/wangjunjie/Documents/Work/Personal/tempo/app && pnpm exec tsc --noEmit --skipLibCheck`
Expected: 无错误

- [ ] **Step 6: Commit**

```bash
git add app/modules/ai/components/AiFloatingAssistant.tsx
git commit -m "feat(ai): add cancel button UI and cancelled message label"
```

---

## Task 4: 端到端验证

- [ ] **Step 1: 真机/模拟器启动 App**

```bash
cd /Users/wangjunjie/Documents/Work/Personal/tempo/app && pnpm exec expo run:ios --device
```

- [ ] **Step 2: 验证取消按钮出现时机**

向 AI 提问，在 AI 开始输出（`sending` / `streaming` 状态）时确认：
1. 麦克风按钮变为红色双竖条图标
2. `holdHint` 文案变为"点击取消"
3. 按钮可点击（非 disabled）

- [ ] **Step 3: 验证点击取消后的行为**

1. 点击红色取消按钮，SSE 流中断
2. 对话框中用户消息下方出现灰色"（取消）"
3. 已显示的 AI thinking 内容保留在对话框中
4. 状态恢复为 `idle`，按钮恢复为麦克风图标

- [ ] **Step 4: 验证上下文过滤**

再次向 AI 提问，确认后端请求中 `messages` 不包含上一轮被取消的对话内容。

- [ ] **Step 5: 验证 `executing` 状态**

触发一个需要确认的日程创建命令（如"明天下午3点开会"），在命令卡片显示后点击确认，观察 `executing` 阶段：
1. 按钮应为 disabled 状态
2. 文案显示"AI 处理中..."
3. 无取消按钮

- [ ] **Step 6: Commit（如有需要）**

如验证过程中发现修复，单独 commit。

---

## Self-Review

**1. Spec coverage:**
- ✅ AI 输出时红色取消按钮 — Task 3
- ✅ 点击取消中断 SSE — Task 2 Step 2 (`abortResponse` 调用 `abortRef.current()`)
- ✅ 用户消息保留并显示"（取消）" — Task 2 Step 2 + Task 3 Step 2
- ✅ thinking 内容保留 — 已由前期代码保证（append 模式）
- ✅ 后续对话不携带被取消内容 — Task 2 Step 2 (`setAiMessages` 回滚快照)

**2. Placeholder scan:** 无 TBD / TODO / 模糊描述。

**3. Type consistency:**
- `roundStartAiMessagesRef` 类型 `AiMessage[]` 与 `setAiMessages` 参数一致
- `cancelled?: boolean` 在 `types.ts` 和 `AiFloatingAssistant.tsx` 的 `m.cancelled` 访问一致
- `abortResponse` 在 `useAiChat` return 和 `AiFloatingAssistant` 解构中名称一致
