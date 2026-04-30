<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { parseSchedule } from "./api/parseSchedule";
import { listSchedules, saveDraft, type StoredSchedule } from "./repos/scheduleRepo";

const text = ref("");
const busy = ref(false);
const error = ref<string | null>(null);
const rows = ref<StoredSchedule[]>([]);

const apiBase = computed(() => {
  const injected = (window as unknown as { __TEMPO_CONFIG__?: { apiBaseUrl?: string } })
    .__TEMPO_CONFIG__?.apiBaseUrl;
  return injected ?? import.meta.env.VITE_API_BASE_URL ?? "";
});

function refresh() {
  rows.value = listSchedules();
}

onMounted(refresh);

async function submit() {
  error.value = null;
  busy.value = true;
  try {
    const env = apiBase.value;
    if (!env) throw new Error("missing_api_base");
    const envTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const envelope = await parseSchedule({
      text: text.value,
      timezone: envTz,
      locale: navigator.language,
      baseUrl: env,
    });
    if (envelope.code !== 0 || !envelope.data) {
      error.value = envelope.msg || `error_${envelope.code}`;
      return;
    }
    saveDraft(envelope.data);
    text.value = "";
    refresh();
  } catch (e) {
    error.value = e instanceof Error ? e.message : "unknown_error";
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <main style="padding: 16px; font-family: system-ui">
    <h1 style="font-size: 20px">Tempo</h1>
    <textarea v-model="text" rows="4" style="width: 100%; box-sizing: border-box" />
    <div style="margin-top: 8px">
      <button type="button" :disabled="busy || !text.trim()" @click="submit">解析并保存</button>
    </div>
    <p v-if="error" style="color: crimson">Error: {{ error }}</p>
    <h2 style="margin-top: 24px; font-size: 16px">已保存</h2>
    <ul>
      <li v-for="r in rows" :key="r.id">
        <strong>{{ r.title }}</strong>
        <div style="opacity: 0.7; font-size: 12px">{{ r.start_at }} → {{ r.end_at }}</div>
      </li>
    </ul>
  </main>
</template>
