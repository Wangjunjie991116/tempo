import Voice from "@react-native-voice/voice";
import { BlurView } from "expo-blur";
import * as Localization from "expo-localization";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
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

const BAR_COUNT = 21;

type ChatBubble = {
  id: string;
  role: "assistant" | "user";
  text: string;
};

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

/**
 * 全局 AI 语音入口浮层（悬浮机器人 + 底部对话面板）。
 * UI 独立于业务 Tab；编排与对不同 Tab 的指令分发可在上层 Context / 事件中扩展。
 */
export function AiFloatingAssistant() {
  const t = useTempoTheme();
  const insets = useSafeAreaInsets();
  const { t: tr } = useTranslation(["ai"]);

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatBubble[]>([]);
  const [holding, setHolding] = useState(false);
  const [waveTick, setWaveTick] = useState(0);
  const [liveVol, setLiveVol] = useState(0.12);

  const transcriptRef = useRef("");
  const volumeNormRef = useRef(0.15);
  const shimmer = useRef(new Animated.Value(0)).current;
  const fabBob = useRef(new Animated.Value(0)).current;
  const volFlushRaf = useRef<number | null>(null);
  const chatScrollRef = useRef<ScrollView | null>(null);
  const trRef = useRef(tr);
  trRef.current = tr;
  const msgIdSeq = useRef(0);
  const nextMsgId = useCallback((prefix: string) => {
    msgIdSeq.current += 1;
    return `${prefix}-${Date.now()}-${msgIdSeq.current}`;
  }, []);

  const holdStartTimeRef = useRef(0);
  const isShortSilentTapRef = useRef(false);

  const tabBarBump = Platform.OS === "ios" ? 52 : 58;
  const fabBottom = Math.max(insets.bottom, 10) + tabBarBump + t.space.sm;

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
    setMessages((prev) => {
      if (prev.length > 0) return prev;
      return [
        {
          id: "intro",
          role: "assistant",
          text: tr("ai:assistantIntro"),
        },
      ];
    });
  }, [tr]);

  useEffect(() => {
    const drift = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 2600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 2600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    const bob = Animated.loop(
      Animated.sequence([
        Animated.timing(fabBob, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(fabBob, {
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
    setHolding(false);
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
      if (phrase && phrase.trim().length > 0)
        transcriptRef.current = phrase.trim();
    };
    Voice.onSpeechPartialResults = (e) => {
      const phrase = e.value?.[0];
      if (phrase && phrase.trim().length > 0)
        transcriptRef.current = phrase.trim();
    };
    Voice.onSpeechVolumeChanged = (e) => {
      volumeNormRef.current = normalizeSpeechVolume(e.value);
      flushVolumeUi();
    };
    Voice.onSpeechError = (e) => {
      const elapsed = Date.now() - holdStartTimeRef.current;
      if (isShortSilentTapRef.current || elapsed < 1000) {
        return;
      }
      // 长按后的语音引擎错误由 finalizeUtterance 统一收口，避免和 info Toast 竞态
      transcriptRef.current = "";
      if (__DEV__) console.warn("[ai-voice] engine error", e.error?.code, e.error?.message);
    };

    return () => {
      if (volFlushRaf.current != null) {
        cancelAnimationFrame(volFlushRaf.current);
        volFlushRaf.current = null;
      }
      void Voice.destroy()
        .then(() => Voice.removeAllListeners())
        .catch(() => undefined);
      transcriptRef.current = "";
    };
  }, [open]);

  useEffect(() => {
    if (!holding) return;
    const id = setInterval(() => setWaveTick((n) => n + 1), 48);
    return () => clearInterval(id);
  }, [holding]);

  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => {
      chatScrollRef.current?.scrollToEnd({ animated: true });
    });
  }, [messages, open]);

  const finalizeUtterance = useCallback(async () => {
    setHolding(false);
    volumeNormRef.current = 0.12;
    setLiveVol(0.12);

    await Voice.stop().catch(() => undefined);

    const text = transcriptRef.current.trim();
    const duration = Date.now() - holdStartTimeRef.current;
    transcriptRef.current = "";

    if (!text) {
      if (duration < 1000) {
        isShortSilentTapRef.current = true;
        Toast.show({
          type: "info",
          text1: tr("ai:speechTooShort"),
        });
      } else {
        Toast.show({
          type: "info",
          text1: tr("ai:speechNoInput"),
        });
      }
      return;
    }

    const userBubble: ChatBubble = {
      id: nextMsgId("u"),
      role: "user",
      text,
    };
    const ack: ChatBubble = {
      id: nextMsgId("a"),
      role: "assistant",
      text: tr("ai:assistantAck"),
    };
    setMessages((cur) => [...cur, userBubble, ack]);
  }, [tr]);

  const startHold = useCallback(async () => {
    appendAssistantIntro();
    transcriptRef.current = "";
    volumeNormRef.current = 0.12;
    setLiveVol(0.12);
    setHolding(true);
    holdStartTimeRef.current = Date.now();
    isShortSilentTapRef.current = false;

    try {
      await Voice.cancel().catch(() => undefined);
      await Voice.start(pickVoiceLocale());
    } catch {
      setHolding(false);
      Toast.show({
        type: "error",
        text1: tr("ai:speechUnavailable"),
      });
    }
  }, [appendAssistantIntro, tr]);

  const fabTranslateY = fabBob.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -5],
  });

  const orbPulse = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.97, 1.07],
  });

  const panelHeight = Math.min(Dimensions.get("window").height * 0.72, 560);

  return (
    <>
      <Animated.View
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
          <Animated.View style={{ transform: [{ scale: orbPulse }] }}>
            <AiRobotOrbGraphic size={52} />
          </Animated.View>
        </Pressable>
      </Animated.View>

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
              {messages.map((m) => (
                <View
                  key={m.id}
                  style={[
                    styles.bubbleRow,
                    m.role === "user"
                      ? styles.bubbleRowUser
                      : styles.bubbleRowAssistant,
                  ]}
                >
                  <View
                    style={[
                      styles.bubble,
                      m.role === "user"
                        ? { backgroundColor: t.brand }
                        : { backgroundColor: t.brandSelectedHighlight },
                    ]}
                  >
                    <Text
                      style={[
                        styles.bubbleText,
                        {
                          color:
                            m.role === "user"
                              ? t.surfaceElevated
                              : t.textPrimary,
                        },
                      ]}
                    >
                      {m.text}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>

            <View style={[styles.voiceDock, { borderTopColor: palette.line }]}>
              <Text style={[styles.holdHint, { color: palette.muted }]}>
                {holding ? tr("ai:holdListening") : tr("ai:holdToSpeak")}
              </Text>
              <View style={styles.waveRow}>
                {Array.from({ length: BAR_COUNT }).map((_, i) => {
                  const base = Math.sin(waveTick / 3 + i * 0.55) * 0.35 + 0.65;
                  const vol = holding ? liveVol : 0.1;
                  const h = 4 + 22 * base * (0.25 + vol * 0.75);
                  return (
                    <View
                      key={i}
                      style={[
                        styles.waveBar,
                        {
                          height: h,
                          backgroundColor: holding ? t.brand : palette.line,
                          opacity: holding ? 0.35 + vol * 0.55 : 0.35,
                        },
                      ]}
                    />
                  );
                })}
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={tr("ai:voiceButtonA11y")}
                onPressIn={startHold}
                onPressOut={finalizeUtterance}
                style={({ pressed }) => [
                  styles.micOuter,
                  {
                    borderColor: holding ? t.brand : palette.line,
                    backgroundColor: holding
                      ? t.brandSelectedHighlight
                      : t.surfaceElevated,
                    transform: [{ scale: pressed || holding ? 1.04 : 1 }],
                  },
                ]}
              >
                <Svg width={28} height={28} viewBox="0 0 24 24">
                  <Path
                    d="M12 14a3 3 0 0 0 3-3V7a3 3 0 0 0-6 0v4a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V20H9v2h6v-2h-2v-2.08A7 7 0 0 0 19 11h-2z"
                    fill={t.brand}
                  />
                </Svg>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
  voiceDock: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 12,
    alignItems: "center",
    gap: 10,
  },
  holdHint: {
    fontFamily: "Manrope_500Medium",
    fontSize: 12,
  },
  waveRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 3,
    height: 32,
    marginBottom: 4,
  },
  waveBar: {
    width: 4,
    borderRadius: 2,
  },
  micOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
});
