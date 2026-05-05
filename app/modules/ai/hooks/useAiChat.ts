import { useCallback, useEffect, useRef, useState } from "react";

import { apiStream, type ChatRequest, type SseEvent } from "../api";
import { Toast } from "../../../core/ui";
import {
  addScheduleItem,
  deleteScheduleItem,
  findScheduleItems,
  updateScheduleItem,
} from "../../schedule/repo/scheduleStorage";
import type { ScheduleItem } from "../../schedule/repo/types";
import type {
  AiAction,
  AiChatState,
  AiCommand,
  AiMessage,
  AiStageLabel,
  ChatMessage,
} from "../types";

function nextId(prefix: string, seqRef: React.MutableRefObject<number>): string {
  seqRef.current += 1;
  return `${prefix}-${Date.now()}-${seqRef.current}`;
}

function formatScheduleResult(items: ScheduleItem[]): string {
  if (items.length === 0) return "没有找到匹配的日程。";
  return items
    .map((item) => {
      const start = new Date(item.startAt).toLocaleString("zh-CN", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      const end =
        item.endAt > 0
          ? new Date(item.endAt).toLocaleString("zh-CN", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "";
      return `• ${item.title} (${start}${end ? ` - ${end}` : ""})`;
    })
    .join("\n");
}

export function useAiChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [aiMessages, setAiMessages] = useState<AiMessage[]>([]);
  const [state, setState] = useState<AiChatState>("idle");
  const [currentStage, setCurrentStage] = useState<AiStageLabel | null>(null);
  const [pendingCommand, setPendingCommand] = useState<AiCommand | null>(null);
  const [pendingBatch, setPendingBatch] = useState<AiCommand[] | null>(null);
  const [roundCount, setRoundCount] = useState(0);
  const pendingCommandRef = useRef<AiCommand | null>(null);
  const pendingBatchRef = useRef<AiCommand[] | null>(null);
  const seqRef = useRef(0);
  const abortRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    pendingCommandRef.current = pendingCommand;
  }, [pendingCommand]);

  useEffect(() => {
    pendingBatchRef.current = pendingBatch;
  }, [pendingBatch]);

  const resetState = useCallback(() => {
    setState("idle");
    setCurrentStage(null);
    setPendingCommand(null);
    setPendingBatch(null);
    setRoundCount(0);
    if (abortRef.current) {
      abortRef.current();
      abortRef.current = null;
    }
  }, []);

  const executeCommand = useCallback(
    async (command: AiCommand, _msgId: string): Promise<string> => {
      try {
        switch (command.action) {
          case "create_schedule": {
            const params = command.params;
            const startAt = params.start_at
              ? Date.parse(params.start_at as string)
              : Date.now();
            const endAt = params.end_at
              ? Date.parse(params.end_at as string)
              : startAt + 3600000;
            const tag = (params.tag as ScheduleItem["tag"]) ?? "workshop";
            if (
              tag !== "design_review" &&
              tag !== "workshop" &&
              tag !== "brainstorm"
            ) {
              return `创建失败：不支持的标签类型 "${tag}"。`;
            }
            await addScheduleItem({
              title: (params.title as string) ?? "未命名日程",
              tag,
              startAt,
              endAt: params.all_day ? startAt + 86399000 : endAt,
              status: "upcoming",
              attendeeCount: (params.attendee_count as number) ?? 1,
            });
            return `已创建日程：${params.title ?? "未命名日程"}`;
          }
          case "update_schedule": {
            const params = command.params;
            let id = params.id as string | undefined;
            if (!id && params.query_hint) {
              const matches = await findScheduleItems({
                keyword: params.query_hint as string,
              });
              if (matches.length === 0) {
                return `更新失败：未找到与 "${params.query_hint}" 匹配的日程。`;
              }
              if (matches.length > 1) {
                return `找到多个匹配日程，请提供更精确的描述：\n${formatScheduleResult(matches)}`;
              }
              id = matches[0].id;
            }
            if (!id) {
              return "更新失败：缺少日程 ID 或定位描述。";
            }
            const patch: Partial<Omit<ScheduleItem, "id">> = {};
            if (params.title) patch.title = params.title as string;
            if (params.start_at)
              patch.startAt = Date.parse(params.start_at as string);
            if (params.end_at)
              patch.endAt = Date.parse(params.end_at as string);
            if (params.tag) patch.tag = params.tag as ScheduleItem["tag"];
            if (params.status) patch.status = params.status as ScheduleItem["status"];
            if (typeof params.attendee_count === "number")
              patch.attendeeCount = params.attendee_count;
            const updated = await updateScheduleItem(id, patch);
            return updated
              ? `已更新日程：${updated.title}`
              : `更新失败：找不到 ID 为 ${id} 的日程。`;
          }
          case "delete_schedule": {
            const params = command.params;
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
            const ok = await deleteScheduleItem(id);
            return ok
              ? `已删除日程。`
              : `删除失败：找不到 ID 为 ${id} 的日程。`;
          }
          case "query_schedule": {
            const params = command.params;
            const items = await findScheduleItems({
              keyword: params.keyword as string | undefined,
              startAt: params.start_date
                ? Date.parse(params.start_date as string)
                : undefined,
              endAt: params.end_date
                ? Date.parse(params.end_date as string)
                : undefined,
            });
            return formatScheduleResult(items);
          }
          case "chat": {
            const response = (command.params.response as string) ?? "";
            return response.trim().length > 0 ? response : "有什么可以帮你的吗？";
          }
          default:
            return `未知操作：${command.action}`;
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return `执行失败：${message}`;
      }
    },
    [],
  );

  async function executeAction(action: AiAction): Promise<string> {
    const { tool, params } = action;
    switch (tool) {
      case "query_schedule": {
        const items = await findScheduleItems({
          keyword: params.keyword as string | undefined,
          startAt: params.start_date
            ? Date.parse(params.start_date as string)
            : undefined,
          endAt: params.end_date
            ? Date.parse(params.end_date as string)
            : undefined,
        });
        return JSON.stringify(
          items.map((i) => ({
            id: i.id,
            title: i.title,
            start_at: new Date(i.startAt).toISOString(),
            end_at: i.endAt > 0 ? new Date(i.endAt).toISOString() : null,
            tag: i.tag,
          })),
        );
      }
      case "create_schedule": {
        const startAt = params.start_at
          ? Date.parse(params.start_at as string)
          : Date.now();
        const endAt = params.end_at
          ? Date.parse(params.end_at as string)
          : startAt + 3600000;
        const tag = (params.tag as ScheduleItem["tag"]) ?? "workshop";
        if (tag !== "design_review" && tag !== "workshop" && tag !== "brainstorm") {
          return `创建失败：不支持的标签类型 "${tag}"。`;
        }
        await addScheduleItem({
          title: (params.title as string) ?? "未命名日程",
          tag,
          startAt,
          endAt: params.all_day ? startAt + 86399000 : endAt,
          status: "upcoming",
          attendeeCount: (params.attendee_count as number) ?? 1,
        });
        return `已创建日程：${params.title ?? "未命名日程"}`;
      }
      case "update_schedule": {
        let id = params.id as string | undefined;
        if (!id && params.query_hint) {
          const matches = await findScheduleItems({
            keyword: params.query_hint as string,
          });
          if (matches.length === 0) {
            return `更新失败：未找到与 "${params.query_hint}" 匹配的日程。`;
          }
          if (matches.length > 1) {
            return `找到多个匹配日程，请提供更精确的描述：\n${formatScheduleResult(matches)}`;
          }
          id = matches[0].id;
        }
        if (!id) {
          return "更新失败：缺少日程 ID 或定位描述。";
        }
        const patch: Partial<Omit<ScheduleItem, "id">> = {};
        if (params.title) patch.title = params.title as string;
        if (params.start_at) patch.startAt = Date.parse(params.start_at as string);
        if (params.end_at) patch.endAt = Date.parse(params.end_at as string);
        if (params.tag) patch.tag = params.tag as ScheduleItem["tag"];
        if (params.status) patch.status = params.status as ScheduleItem["status"];
        if (typeof params.attendee_count === "number") patch.attendeeCount = params.attendee_count;
        const updated = await updateScheduleItem(id, patch);
        return updated
          ? `已更新日程：${updated.title}`
          : `更新失败：找不到 ID 为 ${id} 的日程。`;
      }
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
        const ok = await deleteScheduleItem(id);
        return ok
          ? `已删除日程。`
          : `删除失败：找不到 ID 为 ${id} 的日程。`;
      }
      default:
        return `未知工具：${tool}`;
    }
  }

  async function processRound(
    text: string,
    currentAiMessages: AiMessage[],
    assistantMsgId: string,
    currentRound: number,
    isContinuation: boolean,
  ) {
    if (!isContinuation) {
      resetState();
      const userMsg: ChatMessage = {
        id: nextId("u", seqRef),
        role: "user",
        type: "user",
        text: text.trim(),
      };
      setMessages((prev) => [...prev, userMsg]);

      const assistantMsg: ChatMessage = {
        id: assistantMsgId,
        role: "assistant",
        type: "thinking",
        stages: [],
        thoughts: "",
      };
      setMessages((prev) => [...prev, assistantMsg]);
    }
    setAiMessages(currentAiMessages);

    setState("sending");
    setRoundCount(currentRound);

    try {
      let collectedAction: AiAction | null = null;
      let collectedCommand: AiCommand | null = null;
      let collectedBatch = null as AiCommand[] | null;
      let hasStartedStreaming = false;

      console.log("[useAiChat] sending request:", text.trim(), "round:", currentRound);

      await new Promise<void>((resolve, reject) => {
        abortRef.current = apiStream(
          "/api/v1/ai/chat",
          {
            text: text.trim(),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            locale: Intl.DateTimeFormat().resolvedOptions().locale,
            context: {
              currentTime: new Date().toISOString(),
              availableTags: ["design_review", "workshop", "brainstorm"],
            },
            messages: currentAiMessages,
          } as ChatRequest,
          {
            onEvent: (ev: SseEvent) => {
              if (!hasStartedStreaming) {
                hasStartedStreaming = true;
                setState("streaming");
              }
              console.log("[useAiChat] sse event:", ev.event, ev.data);
              if (ev.event === "stage") {
                const stageData = ev.data as AiStageLabel;
                setCurrentStage(stageData);
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId && m.type === "thinking"
                      ? { ...m, stages: [...m.stages, stageData] }
                      : m,
                  ),
                );
              } else if (ev.event === "thought") {
                const delta = (ev.data as { delta: string }).delta;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId && m.type === "thinking"
                      ? { ...m, thoughts: m.thoughts + delta }
                      : m,
                  ),
                );
              } else if (ev.event === "action") {
                collectedAction = ev.data as AiAction;
              } else if (ev.event === "final") {
                const data = ev.data as { command?: AiCommand; commands?: AiCommand[] };
                let cmd: AiCommand | null = null;
                let batch: AiCommand[] | null = null;
                if (data.commands && data.commands.length > 0) {
                  cmd = data.commands[0];
                  if (data.commands.length > 1) {
                    batch = data.commands;
                    console.log("[useAiChat] multiple commands received:", data.commands);
                  }
                } else if (data.command) {
                  cmd = data.command;
                }
                if (cmd) {
                  collectedCommand = cmd;
                  collectedBatch = batch;
                  setPendingBatch(batch);
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantMsgId && m.type === "thinking"
                        ? { ...m, command: cmd, commands: batch ?? undefined }
                        : m,
                    ),
                  );
                }
              } else if (ev.event === "command") {
                const cmd = ev.data as AiCommand;
                collectedCommand = cmd;
                collectedBatch = null;
                setPendingBatch(null);
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId && m.type === "thinking"
                      ? { ...m, command: cmd }
                      : m,
                  ),
                );
              } else if (ev.event === "error") {
                const errData = ev.data as { code: number; message: string };
                reject(new Error(errData.message));
              }
            },
            onError: (err) => reject(err),
            onDone: () => resolve(),
          },
        );
      });

      if (collectedAction) {
        const action = collectedAction as AiAction;

        if (currentRound >= 2) {
          Toast.show({ type: "error", text1: "操作过于复杂，请分步说明" });
          setState("error");
          return;
        }

        const observation = await executeAction(action);

        const toolCallId = `call_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const assistantMsg: AiMessage = {
          role: "assistant",
          content: "",
          tool_calls: [
            {
              id: toolCallId,
              type: "function",
              function: {
                name: action.tool,
                arguments: JSON.stringify(action.params),
              },
            },
          ],
        };
        const toolMsg: AiMessage = {
          role: "tool",
          content: observation,
          tool_call_id: toolCallId,
          name: action.tool,
        };
        const newMessages: AiMessage[] = [
          ...currentAiMessages,
          assistantMsg,
          toolMsg,
        ];

        await processRound(text, newMessages, assistantMsgId, currentRound + 1, true);
        return;
      }

      if (collectedCommand) {
        const cmd = collectedCommand as AiCommand;

        if (cmd.confidence < 0.7) {
          setPendingCommand(cmd);
          setState("confirming");
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId
                ? {
                    id: assistantMsgId,
                    role: "assistant",
                    type: "command",
                    command: cmd,
                    commands: collectedBatch ?? undefined,
                    confirmed: false,
                  }
                : m,
            ),
          );
          return;
        }

        if (cmd.action === "create_schedule") {
          setPendingCommand(cmd);
          setState("confirming");
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId
                ? {
                    id: assistantMsgId,
                    role: "assistant",
                    type: "command",
                    command: cmd,
                    commands: collectedBatch ?? undefined,
                    confirmed: false,
                  }
                : m,
            ),
          );
          return;
        }

        setState("executing");
        if (Array.isArray(collectedBatch) && collectedBatch.length > 0) {
          const results: string[] = [];
          for (const c of collectedBatch) {
            const result = await executeCommand(c, assistantMsgId);
            results.push(result);
          }
          const combinedText = results.join("\n");
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId
                ? {
                    id: assistantMsgId,
                    role: "assistant",
                    type: "text",
                    text: combinedText,
                  }
                : m,
            ),
          );
          setAiMessages((prev) => [...prev, { role: "assistant", content: combinedText }]);
        } else {
          const resultText = await executeCommand(cmd, assistantMsgId);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId
                ? {
                    id: assistantMsgId,
                    role: "assistant",
                    type: "text",
                    text: resultText,
                  }
                : m,
            ),
          );
          setAiMessages((prev) => [...prev, { role: "assistant", content: resultText }]);
        }
        setState("done");
      } else {
        const fallbackText = "抱歉，我没有理解你的请求。";
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                  id: assistantMsgId,
                  role: "assistant",
                  type: "text",
                  text: fallbackText,
                }
              : m,
          ),
        );
        setAiMessages((prev) => [...prev, { role: "assistant", content: fallbackText }]);
        setState("done");
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "网络异常，请稍后重试";
      Toast.show({ type: "error", text1: message });
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? {
                id: assistantMsgId,
                role: "assistant",
                type: "error",
                text: message,
              }
            : m,
        ),
      );
      setState("error");
    }
  }

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || state === "sending" || state === "streaming" || state === "executing") return;

      const assistantMsgId = nextId("a", seqRef);
      const initialMessages: AiMessage[] = [
        ...aiMessages,
        { role: "user", content: text.trim() },
      ];

      await processRound(text.trim(), initialMessages, assistantMsgId, 0, false);
    },
    [state, resetState, aiMessages],
  );

  const confirmCommand = useCallback(async () => {
    const batch = pendingBatchRef.current;
    const cmd = pendingCommandRef.current;
    if (!cmd && (!batch || batch.length === 0)) return;

    setPendingCommand(null);
    setPendingBatch(null);
    pendingBatchRef.current = null;
    setState("executing");

    if (batch && batch.length > 0) {
      const results: string[] = [];
      for (const c of batch) {
        const result = await executeCommand(c, "confirm");
        results.push(result);
      }
      const combinedText = results.join("\n");
      setMessages((prev) =>
        prev.map((m) =>
          m.type === "command" &&
          (m.command === cmd || (batch && m.commands === batch))
            ? {
                id: m.id,
                role: "assistant",
                type: "text",
                text: combinedText,
              }
            : m,
        ),
      );
      setAiMessages((prev) => [...prev, { role: "assistant", content: combinedText }]);
    } else if (cmd) {
      const resultText = await executeCommand(cmd, "confirm");
      setMessages((prev) =>
        prev.map((m) =>
          m.type === "command" && m.command === cmd
            ? {
                id: m.id,
                role: "assistant",
                type: "text",
                text: resultText,
              }
            : m,
        ),
      );
      setAiMessages((prev) => [...prev, { role: "assistant", content: resultText }]);
    }
    setState("done");
  }, [executeCommand]);

  const cancelCommand = useCallback(() => {
    const cmd = pendingCommandRef.current;
    const batch = pendingBatchRef.current;
    const cancelText = "已取消操作。";
    setPendingCommand(null);
    setPendingBatch(null);
    pendingBatchRef.current = null;
    setState("idle");
    setMessages((prev) =>
      prev.map((m) =>
        m.type === "command" &&
        (m.command === cmd || (batch && m.commands === batch))
          ? {
              id: m.id,
              role: "assistant",
              type: "text",
              text: cancelText,
            }
          : m,
      ),
    );
    setAiMessages((prev) => [...prev, { role: "assistant", content: cancelText }]);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setAiMessages([]);
    resetState();
  }, [resetState]);

  return {
    messages,
    state,
    currentStage,
    pendingCommand,
    sendMessage,
    confirmCommand,
    cancelCommand,
    clearMessages,
  };
}
