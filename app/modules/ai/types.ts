export type AiStage =
  | "understanding"
  | "analyzing"
  | "thinking"
  | "confirming"
  | "done";

export type AiStageLabel = {
  stage: AiStage;
  label: string;
};

export type AiCommand = {
  action:
    | "create_schedule"
    | "update_schedule"
    | "delete_schedule"
    | "query_schedule"
    | "chat";
  params: Record<string, unknown>;
  confidence: number;
};

export type AiToolCall = {
  id: string;
  type: string;
  function: {
    name: string;
    arguments: string;
  };
};

export type AiMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_calls?: AiToolCall[];
  tool_call_id?: string;
  name?: string;
};

export type AiAction = {
  tool: string;
  params: Record<string, unknown>;
};

export type StreamEvent =
  | { event: "stage"; data: AiStageLabel }
  | { event: "thought"; data: { delta: string } }
  | { event: "command"; data: AiCommand }
  | { event: "action"; data: AiAction }
  | { event: "final"; data: { command: AiCommand } }
  | { event: "done"; data: { traceId: string; needsContinuation?: boolean } }
  | { event: "error"; data: { code: number; message: string } };

export type ChatMessage =
  | { id: string; role: "user"; type: "user"; text: string }
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

export type AiChatState =
  | "idle"
  | "sending"
  | "streaming"
  | "confirming"
  | "executing"
  | "done"
  | "error";
