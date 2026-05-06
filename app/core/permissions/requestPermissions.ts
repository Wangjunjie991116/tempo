import AsyncStorage from "@react-native-async-storage/async-storage";
import { check, request, PERMISSIONS, RESULTS } from "react-native-permissions";

const VOICE_PERMISSIONS_KEY = "tempo.voice_permissions_requested";

export type VoicePermissionStatus = {
  microphone: "granted" | "denied" | "blocked" | "unavailable";
  speechRecognition: "granted" | "denied" | "blocked" | "unavailable";
};

export type VoicePermissionKey = "microphone" | "speechRecognition";

function mapResult(result: string): VoicePermissionStatus["microphone"] {
  if (result === RESULTS.GRANTED) return "granted";
  if (result === RESULTS.BLOCKED) return "blocked";
  if (result === RESULTS.UNAVAILABLE) return "unavailable";
  return "denied";
}

/**
 * 检查麦克风和语音识别权限状态。
 */
export async function checkVoicePermissions(): Promise<VoicePermissionStatus> {
  const [microphone, speechRecognition] = await Promise.all([
    check(PERMISSIONS.IOS.MICROPHONE),
    check(PERMISSIONS.IOS.SPEECH_RECOGNITION),
  ]);

  return {
    microphone: mapResult(microphone),
    speechRecognition: mapResult(speechRecognition),
  };
}

/**
 * 登录页首次进入时请求语音相关权限。
 * 已请求过则自动跳过，避免重复弹窗。
 *
 * @returns 是否两个权限都已授权
 *
 * @example
 * ```ts
 * useEffect(() => {
 *   void requestVoicePermissions();
 * }, []);
 * ```
 */
export async function requestVoicePermissions(): Promise<boolean> {
  try {
    const hasRequested = await AsyncStorage.getItem(VOICE_PERMISSIONS_KEY);
    if (hasRequested) {
      const status = await checkVoicePermissions();
      return (
        status.microphone === "granted" &&
        status.speechRecognition === "granted"
      );
    }

    const micResult = await request(PERMISSIONS.IOS.MICROPHONE);
    const speechResult = await request(PERMISSIONS.IOS.SPEECH_RECOGNITION);

    await AsyncStorage.setItem(VOICE_PERMISSIONS_KEY, "true");

    return micResult === RESULTS.GRANTED && speechResult === RESULTS.GRANTED;
  } catch {
    return false;
  }
}

/**
 * 在 AI 对话框中确保有语音权限。
 *
 * - 从未请求过（denied）→ 主动弹出系统权限框请求
 * - 已被拒绝（blocked）→ 返回缺少的权限 key，由调用方拼接 i18n 文案
 * - 已授权 → 直接通过
 *
 * @returns granted 是否已授权；missing 缺少的权限 key 列表
 */
export async function ensureVoicePermissions(): Promise<{
  granted: boolean;
  missing: VoicePermissionKey[];
}> {
  let status = await checkVoicePermissions();

  // 尝试请求尚未决定的权限
  if (status.microphone === "denied") {
    await request(PERMISSIONS.IOS.MICROPHONE);
  }
  if (status.speechRecognition === "denied") {
    await request(PERMISSIONS.IOS.SPEECH_RECOGNITION);
  }

  // 请求后重新检查
  status = await checkVoicePermissions();

  const missing: VoicePermissionKey[] = [];
  if (status.microphone !== "granted") missing.push("microphone");
  if (status.speechRecognition !== "granted") missing.push("speechRecognition");

  return { granted: missing.length === 0, missing };
}
