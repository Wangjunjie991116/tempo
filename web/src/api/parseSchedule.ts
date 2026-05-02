import type { ApiEnvelope, ScheduleDraft } from "../types/api";

/**
 * 调用后端 **`POST /api/v1/schedule/parse`**，将自然语言文本解析为结构化日程草稿。
 *
 * @param input.text 用户输入的解析文本
 * @param input.timezone 可选 IANA 时区等（透传服务端）
 * @param input.locale 可选 BCP 47 locale（透传服务端）
 * @param input.baseUrl API 根 URL（可含末尾 `/`，会自动去掉）
 * @returns `ApiEnvelope<ScheduleDraft>`（HTTP 非 2xx 时抛错）
 *
 * @example
 * ```ts
 * const env = await parseSchedule({
 *   text: "明天下午三点开会",
 *   baseUrl: "http://127.0.0.1:8000",
 * });
 * env.data?.title; // 服务端返回的草稿字段
 * ```
 */
export async function parseSchedule(input: {
  text: string;
  timezone?: string;
  locale?: string;
  baseUrl: string;
}): Promise<ApiEnvelope<ScheduleDraft>> {
  const url = `${input.baseUrl.replace(/\/$/, "")}/api/v1/schedule/parse`;
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: input.text,
      timezone: input.timezone,
      locale: input.locale,
    }),
  });
  if (!resp.ok) {
    throw new Error(`http_${resp.status}`);
  }
  return (await resp.json()) as ApiEnvelope<ScheduleDraft>;
}
