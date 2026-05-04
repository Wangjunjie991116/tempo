import { useCallback, useEffect, useRef, useState } from "react";

import { apiStream, type SseEvent } from "../../../core/api/client";
import { Toast } from "../../../core/ui";
import {
  addScheduleItem,
  deleteScheduleItem,
  findScheduleItems,
  updateScheduleItem,
} from "../../schedule/repo/scheduleStorage";
import type { ScheduleItem } from "../../schedule/repo/types";
import type {
  AiChatState,
  AiCommand,
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
  const [state, setState] = useState<AiChatState>("idle");
  const [currentStage, setCurrentStage] = useState<AiStageLabel | null>(null);
  const [pendingCommand, setPendingCommand] = useState<AiCommand | null>(null);
  const pendingCommandRef = useRef<AiCommand | null>(null);
  const seqRef = useRef(0);
  const abortRef = useRef<(() => void) | null>(null);

  // Keep ref in sync with state so callbacks always see latest value
  useEffect(() => {
    pendingCommandRef.current = pendingCommand;
  }, [pendingCommand]);

  const resetState = useCallback(() => {
    setState("idle");
    setCurrentStage(null);
    setPendingCommand(null);
    if (abortRef.current) {
      abortRef.current();
      abortRef.current = null;
    }
  }, []);

  const executeCommand = useCallback(
    async (command: AiCommand, msgId: string): Promise<string> => {
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
            const id = params.id as string;
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
            const id = command.params.id as string;
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

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || state === "sending" || state === "streaming" || state === "executing") return;

      resetState();
      const userMsg: ChatMessage = {
        id: nextId("u", seqRef),
        role: "user",
        type: "user",
        text: text.trim(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setState("sending");

      const assistantMsgId = nextId("a", seqRef);
      const assistantMsg: ChatMessage = {
        id: assistantMsgId,
        role: "assistant",
        type: "thinking",
        stages: [],
        thoughts: "",
      };
      setMessages((prev) => [...prev, assistantMsg]);

      try {
        let collectedCommand: AiCommand | null = null;
        let hasStartedStreaming = false;

        console.log("[useAiChat] sending request:", text.trim());

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
            },
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
                } else if (ev.event === "command") {
                  const cmd = ev.data as AiCommand;
                  collectedCommand = cmd;
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

        // After stream ends, decide what to do
        if (collectedCommand) {
          const cmd = collectedCommand as AiCommand;

          // Low confidence: ask user
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
                      confirmed: false,
                    }
                  : m,
              ),
            );
            return;
          }

          // Create action always requires confirmation
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
                      confirmed: false,
                    }
                  : m,
              ),
            );
            return;
          }

          // Other actions execute directly
          setState("executing");
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
          setState("done");
        } else {
          // No command received
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId
                ? {
                    id: assistantMsgId,
                    role: "assistant",
                    type: "text",
                    text: "抱歉，我没有理解你的请求。",
                  }
                : m,
            ),
          );
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
    },
    [state, resetState, executeCommand],
  );

  const confirmCommand = useCallback(async () => {
    const cmd = pendingCommandRef.current;
    if (!cmd) return;

    setPendingCommand(null);
    setState("executing");

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
    setState("done");
  }, [executeCommand]);

  const cancelCommand = useCallback(() => {
    const cmd = pendingCommandRef.current;
    setPendingCommand(null);
    setState("idle");
    setMessages((prev) =>
      prev.map((m) =>
        m.type === "command" && m.command === cmd
          ? {
              id: m.id,
              role: "assistant",
              type: "text",
              text: "已取消操作。",
            }
          : m,
      ),
    );
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
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
