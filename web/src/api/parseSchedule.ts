import type { ApiEnvelope, ScheduleDraft } from "../types/api";

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
