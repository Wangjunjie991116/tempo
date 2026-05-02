/**
 * Web 与 **`service/`** 约定的 HTTP JSON 形态：`/api/v1/schedule/parse` 返回体中的 `data`。
 *
 * 时间字段为 **服务端给出的字符串**（可能为 ISO）；与 RN 日程库的毫秒存储是不同边界。
 */
export interface ScheduleDraft {
  title: string;
  start_at: string | null;
  end_at: string | null;
  all_day: boolean;
  confidence: number;
  notes: string | null;
}

/**
 * 统一响应信封：`code` / `msg` / `data` / `traceId`。
 *
 * @example
 * ```ts
 * const env: ApiEnvelope<ScheduleDraft> = {
 *   code: 0,
 *   msg: "ok",
 *   data: { title: "x", start_at: null, end_at: null, all_day: false, confidence: 1, notes: null },
 *   traceId: "abc",
 * };
 * ```
 */
export interface ApiEnvelope<T> {
  code: number;
  msg: string;
  data: T | null;
  traceId: string;
}
