import Voice from "@react-native-voice/voice";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import * as Localization from "expo-localization";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated as RNAnimated,
  Dimensions,
  Easing,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { navigationRef } from "../../../core/navigation/navigationRef";
import { ROOT_STACK } from "../../../core/navigation/routes";
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  Stop,
} from "react-native-svg";

import { useTranslation } from "../../../core/i18n";
import { useTempoTheme } from "../../../core/theme";
import { Toast, ToastRenderer } from "../../../core/ui";
import { useAiChat } from "../hooks/useAiChat";
import type { ChatMessage } from "../types";
import { VoiceBubble } from "./VoiceBubble";

const BAR_COUNT = 21;

function pickVoiceLocale(): string {
  const tag = Localization.getLocales()?.[0]?.languageTag ?? "en-US";
  if (tag.toLowerCase().startsWith("zh")) return "zh-CN";
  if (tag.toLowerCase().startsWith("ja")) return "ja-JP";
  return "en-US";
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

/** 将平台音量偏移（常为 dB）压到 ~0–1，用于声波条占位计算。 */
function normalizeSpeechVolume(raw?: number) {
  if (raw === undefined || Number.isNaN(raw)) return 0.12;
  return clamp((raw + 42) / 42, 0.08, 1);
}

/** 矢量小机器人图标：渐变球形身体 + 天线 + 高光，外层由 FAB 上做缩放脉冲。 */
function AiRobotOrbGraphic({ size }: { size: number }) {
  const brand = "#6065e6";
  const soft = "#9ea3fa";
  const glow = "#b8bbff";

  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <LinearGradient id="ai-bod" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={brand} stopOpacity={1} />
          <Stop offset="100%" stopColor={soft} stopOpacity={1} />
        </LinearGradient>
        <LinearGradient id="ai-accent" x1="50%" y1="0%" x2="50%" y2="100%">
          <Stop offset="0%" stopColor={glow} stopOpacity={0.95} />
          <Stop offset="100%" stopColor={brand} stopOpacity={1} />
        </LinearGradient>
        <LinearGradient id="ai-halo" x1="40%" y1="20%" x2="80%" y2="80%">
          <Stop offset="0%" stopColor={glow} stopOpacity={0.35} />
          <Stop offset="100%" stopColor={brand} stopOpacity={0} />
        </LinearGradient>
      </Defs>

      <Circle cx={54} cy={18} r={3.2} fill={glow} opacity={0.85} />
      <Circle cx={14} cy={22} r={2.2} fill={glow} opacity={0.35} />

      <Circle
        cx={32}
        cy={32}
        r={31}
        stroke="url(#ai-halo)"
        strokeWidth={3}
        fill="none"
        opacity={1}
      />

      <Path
        d="M32 15v11"
        stroke="url(#ai-accent)"
        strokeWidth={3}
        strokeLinecap="round"
      />
      <Circle cx={32} cy={12} r={5} fill="url(#ai-accent)" opacity={1} />

      <Circle
        cx={32}
        cy={36}
        r={22}
        fill="url(#ai-bod)"
        stroke={glow}
        strokeWidth={2.2}
      />
      <Circle
        cx={32}
        cy={36}
        r={26}
        stroke={glow}
        strokeWidth={1}
        opacity={0.25}
        fill="none"
      />

      <Ellipse cx={25} cy={34} rx={5} ry={5.8} fill="#fff" opacity={0.95} />
      <Ellipse cx={39} cy={34} rx={5} ry={5.8} fill="#fff" opacity={0.95} />
      <Ellipse cx={25} cy={34} rx={2.2} ry={3.4} fill={brand} />
      <Ellipse cx={39} cy={34} rx={2.2} ry={3.4} fill={brand} />

      <Path
        d="M24 45 C28 51,36 51,40 45"
        stroke="#fff"
        strokeWidth={1.9}
        strokeLinecap="round"
        opacity={0.35}
      />

      <G opacity={0.85}>
        <Path d="M18 53h28v11H18z" fill={brand} />
        <Path d="M20 59h24v10H20z" fill="#4c51d9" opacity={0.55} />
      </G>
      <Ellipse cx={32} cy={44} rx={16} ry={8} fill="#ffffff" opacity={0.06} />

      <Ellipse
        cx={32}
        cy={56}
        rx={17}
        ry={5}
        stroke={brand}
        strokeWidth={1.8}
        opacity={0.85}
      />
      <Path
        d="M20 54h24"
        stroke="#fff"
        strokeWidth={3}
        opacity={0.15}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function StageIndicator({
  stage,
  color,
  isActive = false,
}: {
  stage: { stage: string; label: string };
  color: string;
  isActive?: boolean;
}) {
  const scaleAnim = useRef(new RNAnimated.Value(1)).current;
  const opacityAnim = useRef(new RNAnimated.Value(1)).current;

  useEffect(() => {
    if (!isActive) {
      scaleAnim.setValue(1);
      opacityAnim.setValue(1);
      return;
    }

    const scaleLoop = RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(scaleAnim, {
          toValue: 1.6,
          duration: 600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        RNAnimated.timing(scaleAnim, {
          toValue: 1,
          duration: 600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    const opacityLoop = RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(opacityAnim, {
          toValue: 0.4,
          duration: 600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        RNAnimated.timing(opacityAnim, {
          toValue: 1,
          duration: 600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    scaleLoop.start();
    opacityLoop.start();

    return () => {
      scaleLoop.stop();
      opacityLoop.stop();
      scaleAnim.setValue(1);
      opacityAnim.setValue(1);
    };
  }, [isActive, scaleAnim, opacityAnim]);

  return (
    <View style={styles.stageRow}>
      <RNAnimated.View
        style={[
          styles.stageDot,
          {
            backgroundColor: color,
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          },
        ]}
      />
      <Text style={[styles.stageText, { color }]}>{stage.label}</Text>
    </View>
  );
}

function ThinkingBubble({
  message,
  theme,
  isActive,
}: {
  message: Extract<ChatMessage, { type: "thinking" }>;
  theme: ReturnType<typeof useTempoTheme>;
  isActive?: boolean;
}) {
  const hasThoughts = message.thoughts.length > 0;
  const currentStage = message.stages[message.stages.length - 1];

  return (
    <View style={styles.thinkingBubble}>
      {currentStage && (
        <StageIndicator stage={currentStage} color={theme.textMuted} isActive={isActive} />
      )}
      {hasThoughts && (
        <Text
          style={[styles.thinkingText, { color: theme.textMuted }]}
        >
          {message.thoughts}
        </Text>
      )}
    </View>
  );
}

function CommandCard({
  message,
  theme,
  onConfirm,
  onCancel,
}: {
  message: Extract<ChatMessage, { type: "command" }>;
  theme: ReturnType<typeof useTempoTheme>;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { action, params, confidence } = message.command;
  const batch = message.commands && message.commands.length > 0 ? message.commands : null;
  const actionLabels: Record<string, string> = {
    create_schedule: "创建日程",
    update_schedule: "更新日程",
    delete_schedule: "删除日程",
    query_schedule: "查询日程",
    chat: "对话",
  };

  return (
    <View
      style={[
        styles.commandCard,
        { backgroundColor: theme.brandSelectedHighlight },
      ]}
    >
      <Text style={[styles.commandTitle, { color: theme.textPrimary }]}>
        {batch ? `${actionLabels[action] ?? action} (${batch.length} 个)` : (actionLabels[action] ?? action)}
        {confidence < 0.7 && (
          <Text style={{ color: theme.textMuted, fontSize: 12 }}>
            {" "}
            (置信度较低，请确认)
          </Text>
        )}
      </Text>
      {batch ? (
        batch.map((cmd, i) => (
          <View key={i} style={{ marginBottom: 2 }}>
            {typeof cmd.params.title === "string" && (
              <Text style={[styles.commandDetail, { color: theme.textMuted }]}>
                • {cmd.params.title as string}
                {typeof cmd.params.start_at === "string" && ` — ${cmd.params.start_at as string}`}
              </Text>
            )}
          </View>
        ))
      ) : (
        <>
          {typeof params.title === "string" && (
            <Text style={[styles.commandDetail, { color: theme.textMuted }]}>
              标题：{params.title}
            </Text>
          )}
          {typeof params.start_at === "string" && (
            <Text style={[styles.commandDetail, { color: theme.textMuted }]}>
              时间：{params.start_at}
            </Text>
          )}
        </>
      )}
      <View style={styles.commandButtons}>
        <Pressable
          onPress={onConfirm}
          style={({ pressed }) => [
            styles.cmdBtn,
            {
              backgroundColor: theme.brand,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <Text style={styles.cmdBtnText}>确认</Text>
        </Pressable>
        <Pressable
          onPress={onCancel}
          style={({ pressed }) => [
            styles.cmdBtn,
            {
              backgroundColor: theme.surfaceElevated,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <Text style={[styles.cmdBtnText, { color: theme.textPrimary }]}>
            取消
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

/**
 * 全局 AI 语音入口浮层（悬浮机器人 + 底部对话面板）。
 * UI 独立于业务 Tab；编排与对不同 Tab 的指令分发可在上层 Context / 事件中扩展。
 */
function useIsMainRoute(): boolean {
  const [isMain, setIsMain] = useState(false);

  useEffect(() => {
    const checkRoute = () => {
      if (!navigationRef.isReady()) return;
      try {
        const state = navigationRef.getRootState();
        const routeName = state.routes[state.index]?.name;
        setIsMain(routeName === ROOT_STACK.Main);
      } catch {
        // navigation state not available yet
      }
    };

    // initial check with retry for startup timing
    const timer = setTimeout(checkRoute, 0);
    const unsubscribe = navigationRef.addListener("state", checkRoute);
    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  return isMain;
}

export function AiFloatingAssistant() {
  const visible = useIsMainRoute();
  const t = useTempoTheme();
  const insets = useSafeAreaInsets();
  const { t: tr } = useTranslation(["ai"]);

  const { messages, state, sendMessage, confirmCommand, cancelCommand, abortResponse } =
    useAiChat();

  const [open, setOpen] = useState(false);
  type VoiceState = "idle" | "recording" | "preview";
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [waveTick, setWaveTick] = useState(0);
  const [liveVol, setLiveVol] = useState(0.12);
  const [transcript, setTranscript] = useState("");

  const transcriptRef = useRef("");
  const volumeNormRef = useRef(0.15);
  const shimmer = useRef(new RNAnimated.Value(0)).current;
  const fabBob = useRef(new RNAnimated.Value(0)).current;
  const volFlushRaf = useRef<number | null>(null);
  const chatScrollRef = useRef<ScrollView | null>(null);
  const trRef = useRef(tr);
  trRef.current = tr;

  const holdStartTimeRef = useRef(0);
  const isShortSilentTapRef = useRef(false);
  const isReleasingRef = useRef(false);
  const releaseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fabBottom = Math.max(insets.bottom, 10) + t.space.lg;

  const palette = useMemo(
    () => ({
      orbShadow: `${t.brand}55`,
      panelBg: t.surfaceElevated,
      muted: t.textMuted,
      line: t.divider,
    }),
    [t.brand, t.divider, t.surfaceElevated, t.textMuted],
  );

  const appendAssistantIntro = useCallback(() => {
    // 已由 useAiChat 管理消息，intro 在首次打开时通过 assistantAck 体现
    // 保留空函数兼容旧调用
  }, []);

  useEffect(() => {
    const drift = RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(shimmer, {
          toValue: 1,
          duration: 2600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        RNAnimated.timing(shimmer, {
          toValue: 0,
          duration: 2600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    const bob = RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(fabBob, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        RNAnimated.timing(fabBob, {
          toValue: 0,
          duration: 1200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    drift.start();
    bob.start();
    return () => {
      drift.stop();
      bob.stop();
      shimmer.stopAnimation(() => shimmer.setValue(0));
      fabBob.stopAnimation(() => fabBob.setValue(0));
    };
  }, [fabBob, shimmer]);

  useEffect(() => {
    if (open) return;
    setVoiceState("idle");
    setLiveVol(0.12);
    transcriptRef.current = "";
    void Voice.cancel();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const flushVolumeUi = () => {
      if (volFlushRaf.current != null) return;
      volFlushRaf.current = requestAnimationFrame(() => {
        volFlushRaf.current = null;
        setLiveVol(volumeNormRef.current);
      });
    };

    Voice.onSpeechResults = (e) => {
      const phrase = e.value?.[0];
      if (phrase && phrase.trim().length > 0) {
        transcriptRef.current = phrase.trim();
        setTranscript(phrase.trim());
      }
    };
    Voice.onSpeechPartialResults = (e) => {
      const phrase = e.value?.[0];
      if (phrase && phrase.trim().length > 0) {
        transcriptRef.current = phrase.trim();
        setTranscript(phrase.trim());
      }
    };
    Voice.onSpeechVolumeChanged = (e) => {
      volumeNormRef.current = normalizeSpeechVolume(e.value);
      flushVolumeUi();
    };
    Voice.onSpeechEnd = () => {
      // 语音引擎检测到说话结束时，如果用户已经松手，直接触发最终处理
      if (isReleasingRef.current) {
        if (releaseTimeoutRef.current) {
          clearTimeout(releaseTimeoutRef.current);
          releaseTimeoutRef.current = null;
        }
        void finalizeUtterance();
      }
    };
    Voice.onSpeechError = (e) => {
      const elapsed = Date.now() - holdStartTimeRef.current;
      if (isShortSilentTapRef.current || elapsed < 1000) {
        return;
      }
      transcriptRef.current = "";
      if (__DEV__) console.warn("[ai-voice] engine error", e.error?.code, e.error?.message);
    };

    return () => {
      if (volFlushRaf.current != null) {
        cancelAnimationFrame(volFlushRaf.current);
        volFlushRaf.current = null;
      }
      if (releaseTimeoutRef.current) {
        clearTimeout(releaseTimeoutRef.current);
        releaseTimeoutRef.current = null;
      }
      void Voice.destroy()
        .then(() => Voice.removeAllListeners())
        .catch(() => undefined);
      transcriptRef.current = "";
      isReleasingRef.current = false;
    };
  }, [open]);

  useEffect(() => {
    if (voiceState !== "recording") return;
    const id = setInterval(() => setWaveTick((n) => n + 1), 48);
    return () => clearInterval(id);
  }, [voiceState]);

  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => {
      chatScrollRef.current?.scrollToEnd({ animated: true });
    });
  }, [messages, open]);

  const finalizeUtterance = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    isReleasingRef.current = true;
    if (releaseTimeoutRef.current) {
      clearTimeout(releaseTimeoutRef.current);
      releaseTimeoutRef.current = null;
    }
    volumeNormRef.current = 0.12;
    setLiveVol(0.12);
    await Voice.stop().catch(() => undefined);
    const text = transcriptRef.current.trim();
    const duration = Date.now() - holdStartTimeRef.current;

    if (!text) {
      setVoiceState("idle");
      transcriptRef.current = "";
      setTranscript("");
      if (duration < 1000) {
        isShortSilentTapRef.current = true;
        Toast.show({ type: "info", text1: tr("ai:speechTooShort") });
      } else {
        Toast.show({ type: "info", text1: tr("ai:speechNoInput") });
      }
      return;
    }

    setVoiceState("preview");
  }, [tr]);

  const startHold = useCallback(async () => {
    if (state === "sending" || state === "streaming" || state === "executing") return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    isReleasingRef.current = false;
    if (releaseTimeoutRef.current) {
      clearTimeout(releaseTimeoutRef.current);
      releaseTimeoutRef.current = null;
    }
    transcriptRef.current = "";
    setTranscript("");
    volumeNormRef.current = 0.12;
    setLiveVol(0.12);
    setVoiceState("recording");
    holdStartTimeRef.current = Date.now();
    isShortSilentTapRef.current = false;
    try {
      await Voice.cancel().catch(() => undefined);
      await Voice.start(pickVoiceLocale());
    } catch {
      setVoiceState("idle");
      Toast.show({
        type: "error",
        text1: tr("ai:speechUnavailable"),
      });
    }
  }, [tr, state]);

  const handleStartHold = useCallback(() => {
    void startHold();
  }, [startHold]);

  const handleEndHold = useCallback(() => {
    void finalizeUtterance();
  }, [finalizeUtterance]);

  const handleSendFromBubble = useCallback(
    (text: string) => {
      setVoiceState("idle");
      transcriptRef.current = "";
      setTranscript("");
      void sendMessage(text);
    },
    [sendMessage],
  );

  const handleCancelFromBubble = useCallback(() => {
    setVoiceState("idle");
    transcriptRef.current = "";
    setTranscript("");
  }, []);

  const fabTranslateY = fabBob.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -5],
  });

  const orbPulse = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.97, 1.07],
  });

  const panelHeight = Math.min(Dimensions.get("window").height * 0.72, 560);

  const isAiResponding = state === "sending" || state === "streaming";
  const isAiActive =
    state === "sending" || state === "streaming" || state === "executing";

  const renderMessage = (m: ChatMessage) => {
    if (m.role === "user") {
      return (
        <View key={m.id} style={[styles.bubbleRow, styles.bubbleRowUser]}>
          <View style={{ maxWidth: "86%", alignItems: "flex-end" }}>
            <View style={[styles.bubble, { backgroundColor: t.brand, maxWidth: undefined }]}>
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

    if (m.type === "thinking") {
      return (
        <View key={m.id} style={[styles.bubbleRow, styles.bubbleRowAssistant]}>
          <ThinkingBubble message={m} theme={t} isActive={isAiActive} />
        </View>
      );
    }

    if (m.type === "command") {
      return (
        <View key={m.id} style={[styles.bubbleRow, styles.bubbleRowAssistant]}>
          <CommandCard
            message={m}
            theme={t}
            onConfirm={confirmCommand}
            onCancel={cancelCommand}
          />
        </View>
      );
    }

    if (m.type === "error") {
      return (
        <View key={m.id} style={[styles.bubbleRow, styles.bubbleRowAssistant]}>
          <View style={[styles.bubble, { backgroundColor: "#fef2f2" }]}>
            <Text style={[styles.bubbleText, { color: "#ef4444" }]}>
              {m.text}
            </Text>
          </View>
        </View>
      );
    }

    // type === "text"
    return (
      <View key={m.id} style={[styles.bubbleRow, styles.bubbleRowAssistant]}>
        <View
          style={[styles.bubble, { backgroundColor: t.brandSelectedHighlight }]}
        >
          <Text style={[styles.bubbleText, { color: t.textPrimary }]}>
            {m.text}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <>
      {visible && (
        <>
          <RNAnimated.View
            pointerEvents="box-none"
            style={[
              styles.fabWrap,
              {
                bottom: fabBottom,
                right: t.space.lg,
                transform: [{ translateY: fabTranslateY }],
              },
            ]}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={tr("ai:fabA11y")}
              onPress={() => {
                setOpen(true);
                appendAssistantIntro();
              }}
              style={({ pressed }) => [
                styles.fabBtn,
                {
                  backgroundColor: t.surfaceElevated,
                  shadowColor: palette.orbShadow,
                  opacity: pressed ? 0.92 : 1,
                },
              ]}
            >
              <RNAnimated.View style={{ transform: [{ scale: orbPulse }] }}>
                <AiRobotOrbGraphic size={52} />
              </RNAnimated.View>
            </Pressable>
          </RNAnimated.View>

          <Modal
            visible={open}
            transparent
            animationType="fade"
            onRequestClose={() => setOpen(false)}
          >
            <View style={styles.modalRoot}>
              <ToastRenderer />
              {Platform.OS === "ios" ? (
                <BlurView
                  intensity={28}
                  tint="dark"
                  style={StyleSheet.absoluteFill}
                />
              ) : (
                <View style={[StyleSheet.absoluteFill, styles.androidDim]} />
              )}
              <Pressable
                style={StyleSheet.absoluteFill}
                onPress={() => setOpen(false)}
              />

              <View
                style={[
                  styles.sheet,
                  {
                    height: panelHeight,
                    backgroundColor: palette.panelBg,
                    borderTopLeftRadius: t.radius.md,
                    borderTopRightRadius: t.radius.md,
                    paddingBottom: Math.max(insets.bottom, t.space.md),
                  },
                ]}
              >
                <View
                  style={[styles.sheetHandle, { backgroundColor: palette.line }]}
                />
                <Text style={[styles.sheetTitle, { color: t.textPrimary }]}>
                  {tr("ai:panelTitle")}
                </Text>
                <Text style={[styles.sheetHint, { color: palette.muted }]}>
                  {tr("ai:panelHint")}
                </Text>

            <ScrollView
              ref={chatScrollRef}
              style={styles.chatScroll}
              contentContainerStyle={styles.chatContent}
              keyboardShouldPersistTaps="handled"
            >
              {messages.map(renderMessage)}
            </ScrollView>

            <View style={styles.voiceDock}>
              <Text style={[styles.holdHint, { color: palette.muted }]}>
                {voiceState === "recording"
                  ? "松开发送"
                  : voiceState === "preview"
                    ? "点击气泡可编辑"
                    : state === "executing"
                      ? "AI 处理中..."
                      : isAiResponding
                        ? ""
                        : tr("ai:holdToSpeak")}
              </Text>
              <View style={styles.waveRow}>
                {Array.from({ length: BAR_COUNT }).map((_, i) => {
                  const base = Math.sin(waveTick / 3 + i * 0.55) * 0.35 + 0.65;
                  const vol = voiceState === "recording" ? liveVol : 0.1;
                  const h = 4 + 22 * base * (0.25 + vol * 0.75);
                  const isRecording = voiceState === "recording";
                  return (
                    <View
                      key={i}
                      style={[
                        styles.waveBar,
                        {
                          height: h,
                          backgroundColor: isRecording ? t.brand : "rgba(120,120,140,0.25)",
                          opacity: isRecording ? 0.5 + vol * 0.5 : 0.4,
                        },
                      ]}
                    />
                  );
                })}
              </View>

              {(voiceState === "recording" || voiceState === "preview") && (
                <VoiceBubble
                  visible={true}
                  text={transcript}
                  mode={voiceState}
                  onSend={handleSendFromBubble}
                  onCancel={handleCancelFromBubble}
                  theme={{
                    surfaceElevated: t.surfaceElevated,
                    textPrimary: t.textPrimary,
                    textMuted: t.textMuted,
                    brand: t.brand,
                    divider: t.divider,
                  }}
                />
              )}

              {state === "sending" || state === "streaming" || state === "executing" ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="取消 AI 回答"
                  onPress={abortResponse}
                  style={({ pressed }) => [
                    styles.micOuter,
                    {
                      borderColor: "#ef4444",
                      backgroundColor: t.surfaceElevated,
                      transform: [{ scale: pressed ? 1.06 : 1 }],
                      shadowColor: "#ef4444",
                      shadowOpacity: 0.25,
                      shadowRadius: 12,
                      elevation: 6,
                    },
                  ]}
                >
                  <Svg width={28} height={28} viewBox="0 0 24 24">
                    <Path
                      d="M6 4h4v16H6zm8 0h4v16h-4z"
                      fill="#ef4444"
                    />
                  </Svg>
                </Pressable>
              ) : (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={tr("ai:voiceButtonA11y")}
                  onPressIn={handleStartHold}
                  onPressOut={handleEndHold}
                  style={({ pressed }) => [
                    styles.micOuter,
                    {
                      borderColor: voiceState === "recording" ? t.brand : "rgba(120,120,140,0.2)",
                      backgroundColor: voiceState === "recording"
                        ? `${t.brand}15`
                        : t.surfaceElevated,
                      transform: [{ scale: pressed || voiceState === "recording" ? 1.06 : 1 }],
                      shadowColor: voiceState === "recording" ? t.brand : "#000",
                      shadowOpacity: voiceState === "recording" ? 0.3 : 0.08,
                      shadowRadius: voiceState === "recording" ? 16 : 8,
                      elevation: voiceState === "recording" ? 8 : 4,
                    },
                  ]}
                >
                  <Svg width={28} height={28} viewBox="0 0 24 24">
                    <Path
                      d="M12 14a3 3 0 0 0 3-3V7a3 3 0 0 0-6 0v4a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V20H9v2h6v-2h-2v-2.08A7 7 0 0 0 19 11h-2z"
                      fill={voiceState === "recording" ? t.brand : `${t.brand}cc`}
                    />
                  </Svg>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </>
  )}
</>
  );
}

const styles = StyleSheet.create({
  fabWrap: {
    position: "absolute",
    zIndex: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  fabBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
  },
  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },
  androidDim: {
    backgroundColor: "rgba(0,0,0,0.48)",
  },
  sheet: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: 12,
  },
  sheetTitle: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 18,
    lineHeight: 24,
  },
  sheetHint: {
    marginTop: 4,
    fontFamily: "Manrope_500Medium",
    fontSize: 13,
    lineHeight: 20,
  },
  chatScroll: {
    flex: 1,
    marginTop: 16,
  },
  chatContent: {
    paddingBottom: 12,
    gap: 10,
  },
  bubbleRow: {
    width: "100%",
    flexDirection: "row",
  },
  bubbleRowUser: { justifyContent: "flex-end" },
  bubbleRowAssistant: { justifyContent: "flex-start" },
  bubble: {
    maxWidth: "86%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  bubbleText: {
    fontFamily: "Manrope_500Medium",
    fontSize: 15,
    lineHeight: 22,
  },
  thinkingBubble: {
    maxWidth: "86%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: "transparent",
  },
  stageRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  stageDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  stageText: {
    fontFamily: "Manrope_500Medium",
    fontSize: 12,
  },
  thinkingToggle: {
    fontFamily: "Manrope_500Medium",
    fontSize: 12,
    marginBottom: 4,
    textDecorationLine: "underline",
  },
  thinkingText: {
    fontFamily: "Manrope_400Regular",
    fontSize: 13,
    lineHeight: 18,
    fontStyle: "italic",
  },
  commandCard: {
    maxWidth: "86%",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
  },
  commandTitle: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 6,
  },
  commandDetail: {
    fontFamily: "Manrope_400Regular",
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 2,
  },
  commandButtons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  cmdBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
  },
  cmdBtnText: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 14,
    color: "#fff",
  },
  voiceDock: {
    paddingTop: 16,
    alignItems: "center",
    gap: 12,
  },
  holdHint: {
    fontFamily: "Manrope_500Medium",
    fontSize: 13,
    letterSpacing: 0.3,
  },
  waveRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 4,
    height: 36,
    marginBottom: 8,
  },
  waveBar: {
    width: 4,
    borderRadius: 2,
  },
  micOuter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2.5,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
    shadowOffset: { width: 0, height: 4 },
  },
  cancelledLabel: {
    fontFamily: "Manrope_400Regular",
    fontSize: 12,
    marginTop: 4,
    marginRight: 14,
    alignSelf: "flex-end",
  },
});
