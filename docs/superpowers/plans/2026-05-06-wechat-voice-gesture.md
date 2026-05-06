# 微信式语音输入手势交互 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 改造 AI 助手语音输入为微信式手势交互：按住麦克风后手指可滑动到"取消"或"转文字"区域，松手后执行对应操作，"转文字"后弹出底部编辑面板。

**Architecture:** 在 `AiFloatingAssistant` 中引入 `voiceState` 状态机（idle/recording/editing），用 `react-native-gesture-handler` 检测 Pan 手势并计算极坐标判断区域，`react-native-reanimated` 驱动区域高亮和面板动画。编辑面板拆分为独立组件 `VoiceEditPanel`。

**Tech Stack:** React Native, Expo, TypeScript, react-native-gesture-handler, react-native-reanimated

---

## 文件结构

| 文件 | 动作 | 职责 |
|------|------|------|
| `app/package.json` | 修改 | 新增 `react-native-gesture-handler` 和 `react-native-reanimated` 依赖 |
| `app/babel.config.js` | 创建 | 配置 `react-native-reanimated/plugin` |
| `app/modules/ai/components/VoiceEditPanel.tsx` | 创建 | 底部滑出编辑面板（TextInput + 取消/发送按钮） |
| `app/modules/ai/components/AiFloatingAssistant.tsx` | 修改 | 手势检测、区域渲染、voiceState 状态机、录音流程改造 |

---

## Task 1: 安装依赖与 Babel 配置

**Files:**
- Modify: `app/package.json`
- Create: `app/babel.config.js`

- [ ] **Step 1: 安装依赖**

Run:
```bash
cd /Users/wangjunjie/Documents/Work/Personal/tempo/app && pnpm add react-native-gesture-handler react-native-reanimated
```
Expected: 安装成功，无报错

- [ ] **Step 2: 创建 babel.config.js**

在 `/Users/wangjunjie/Documents/Work/Personal/tempo/app/babel.config.js` 写入：
```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: ["react-native-reanimated/plugin"],
  };
};
```

- [ ] **Step 3: 安装依赖后清理缓存验证**

Run:
```bash
cd /Users/wangjunjie/Documents/Work/Personal/tempo/app && pnpm exec tsc --noEmit --skipLibCheck
```
Expected: 无错误（此时新依赖类型声明可能尚未生效，如报错可跳过，后续 Task 再验证）

- [ ] **Step 4: Commit**

```bash
git add app/package.json app/babel.config.js pnpm-lock.yaml
git commit -m "deps: add react-native-gesture-handler and react-native-reanimated"
```

---

## Task 2: VoiceEditPanel 组件

**Files:**
- Create: `app/modules/ai/components/VoiceEditPanel.tsx`

- [ ] **Step 1: 创建 VoiceEditPanel.tsx**

在 `/Users/wangjunjie/Documents/Work/Personal/tempo/app/modules/ai/components/VoiceEditPanel.tsx` 写入：

```tsx
import { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

const SCREEN_H = Dimensions.get("window").height;
const PANEL_H = Math.min(SCREEN_H * 0.45, 380);

export type VoiceEditPanelProps = {
  visible: boolean;
  initialText: string;
  onSend: (text: string) => void;
  onCancel: () => void;
  theme: {
    surfaceElevated: string;
    textPrimary: string;
    textMuted: string;
    brand: string;
    divider: string;
  };
};

export function VoiceEditPanel({
  visible,
  initialText,
  onSend,
  onCancel,
  theme,
}: VoiceEditPanelProps) {
  const translateY = useSharedValue(PANEL_H);
  const inputRef = useRef<TextInput>(null);
  const [text, setText] = useState(initialText);

  useEffect(() => {
    setText(initialText);
  }, [initialText]);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 25, stiffness: 200 });
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      translateY.value = withSpring(PANEL_H, { damping: 25, stiffness: 200 });
    }
  }, [visible, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Pressable
        style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.25)" }]}
        onPress={onCancel}
      />
      <Animated.View
        style={[
          styles.panel,
          animatedStyle,
          { backgroundColor: theme.surfaceElevated },
        ]}
        pointerEvents="box-none"
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.textPrimary }]}>
              识别结果
            </Text>
            <Pressable onPress={onCancel} style={styles.closeBtn}>
              <Text style={{ color: theme.textMuted, fontSize: 22 }}>×</Text>
            </Pressable>
          </View>

          <TextInput
            ref={inputRef}
            style={[
              styles.input,
              {
                color: theme.textPrimary,
                borderColor: theme.divider,
                backgroundColor: theme.surfaceElevated,
              },
            ]}
            multiline
            value={text}
            onChangeText={setText}
            placeholder=""
            autoFocus
          />

          <View style={styles.footer}>
            <Pressable
              onPress={onCancel}
              style={[styles.btnOutline, { borderColor: theme.divider }]}
            >
              <Text style={[styles.btnText, { color: theme.textPrimary }]}>
                取消
              </Text>
            </Pressable>
            <Pressable
              onPress={() => onSend(text.trim())}
              style={[styles.btnPrimary, { backgroundColor: theme.brand }]}
            >
              <Text
                style={[styles.btnText, { color: theme.surfaceElevated }]}
              >
                发送
              </Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: PANEL_H,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 17,
  },
  closeBtn: {
    padding: 4,
  },
  input: {
    flex: 1,
    marginHorizontal: 16,
    marginVertical: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    fontFamily: "Manrope_400Regular",
    fontSize: 15,
    lineHeight: 22,
    textAlignVertical: "top",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: Math.max(16, Platform.OS === "ios" ? 24 : 16),
    paddingTop: 8,
  },
  btnOutline: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  btnPrimary: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  btnText: {
    fontFamily: "Manrope_500Medium",
    fontSize: 15,
  },
});
```

- [ ] **Step 2: TypeScript 类型检查**

Run:
```bash
cd /Users/wangjunjie/Documents/Work/Personal/tempo/app && pnpm exec tsc --noEmit --skipLibCheck
```
Expected: 无错误

- [ ] **Step 3: Commit**

```bash
git add app/modules/ai/components/VoiceEditPanel.tsx
git commit -m "feat(ai): add VoiceEditPanel component"
```

---

## Task 3: AiFloatingAssistant 手势检测与区域渲染

**Files:**
- Modify: `app/modules/ai/components/AiFloatingAssistant.tsx`

- [ ] **Step 1: 添加导入**

在文件顶部导入区域添加：
```tsx
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { VoiceEditPanel } from "./VoiceEditPanel";
```

- [ ] **Step 2: 替换 holding boolean 为 voiceState**

将：
```ts
  const [holding, setHolding] = useState(false);
```
替换为：
```ts
  type VoiceState = "idle" | "recording" | "editing";
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
```

将文件中所有 `holding` 替换为 `voiceState === "recording"`（除了 setHolding 调用处）。

- [ ] **Step 3: 添加手势区域状态**

在 `voiceState` 下方添加：
```ts
  const [activeZone, setActiveZone] = useState<"cancel" | "text" | null>(null);
  const [editText, setEditText] = useState("");
  const micLayoutRef = useRef({ x: 0, y: 0, width: 0, height: 0 });
  const zoneOpacityCancel = useSharedValue(0);
  const zoneOpacityText = useSharedValue(0);
  const zoneScaleCancel = useSharedValue(0.8);
  const zoneScaleText = useSharedValue(0.8);
```

- [ ] **Step 4: 添加手势计算函数**

在 `startHold` 之前添加：
```ts
  const getGestureZone = useCallback(
    (absX: number, absY: number): "cancel" | "text" | null => {
      const { x, y, width, height } = micLayoutRef.current;
      const centerX = x + width / 2;
      const centerY = y + height / 2;
      const dx = absX - centerX;
      const dy = absY - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 40) return null;
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
      // 第一象限上方（角度 -90 ~ 0 即 270 ~ 360）
      if (angle >= -60 && angle <= 0 && dy < 0) return "text";
      // 第二象限上方（角度 -180 ~ -120）
      if (angle >= -180 && angle <= -120 && dy < 0) return "cancel";
      return null;
    },
    [],
  );
```

- [ ] **Step 5: 改造录音控制函数**

将 `startHold` 替换为：
```ts
  const startHold = useCallback(async () => {
    if (state !== "idle") return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    isReleasingRef.current = false;
    if (releaseTimeoutRef.current) {
      clearTimeout(releaseTimeoutRef.current);
      releaseTimeoutRef.current = null;
    }
    transcriptRef.current = "";
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
```

将 `finalizeUtterance` 替换为：
```ts
  const finalizeUtterance = useCallback(
    async (zone: "cancel" | "text" | null) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      isReleasingRef.current = true;
      if (releaseTimeoutRef.current) {
        clearTimeout(releaseTimeoutRef.current);
        releaseTimeoutRef.current = null;
      }
      setVoiceState("idle");
      setActiveZone(null);
      volumeNormRef.current = 0.12;
      setLiveVol(0.12);
      await Voice.stop().catch(() => undefined);
      const text = transcriptRef.current.trim();
      const duration = Date.now() - holdStartTimeRef.current;
      transcriptRef.current = "";
      if (zone === "cancel") {
        return;
      }
      if (!text) {
        if (duration < 1000) {
          isShortSilentTapRef.current = true;
          Toast.show({ type: "info", text1: tr("ai:speechTooShort") });
        } else {
          Toast.show({ type: "info", text1: tr("ai:speechNoInput") });
        }
        return;
      }
      if (zone === "text") {
        setEditText(text);
        setVoiceState("editing");
        return;
      }
      await sendMessage(text);
    },
    [tr, sendMessage],
  );
```

删除 `finalizeUtteranceInternal` 函数（它的逻辑已合并到上面的 `finalizeUtterance` 中）。

- [ ] **Step 6: 添加 Pan 手势**

在 `startHold` 之后添加：
```ts
  const panGesture = useMemo(() => {
    return Gesture.Pan()
      .onBegin(() => {
        void startHold();
      })
      .onChange((e) => {
        const zone = getGestureZone(e.absoluteX, e.absoluteY);
        setActiveZone(zone);
        if (zone === "cancel") {
          zoneOpacityCancel.value = withTiming(1, { duration: 120 });
          zoneScaleCancel.value = withSpring(1.1);
          zoneOpacityText.value = withTiming(0.3, { duration: 120 });
        } else if (zone === "text") {
          zoneOpacityText.value = withTiming(1, { duration: 120 });
          zoneScaleText.value = withSpring(1.1);
          zoneOpacityCancel.value = withTiming(0.3, { duration: 120 });
        } else {
          zoneOpacityCancel.value = withTiming(0.6, { duration: 120 });
          zoneOpacityText.value = withTiming(0.6, { duration: 120 });
          zoneScaleCancel.value = withSpring(1);
          zoneScaleText.value = withSpring(1);
        }
      })
      .onEnd((e) => {
        const zone = getGestureZone(e.absoluteX, e.absoluteY);
        zoneOpacityCancel.value = withTiming(0, { duration: 150 });
        zoneOpacityText.value = withTiming(0, { duration: 150 });
        zoneScaleCancel.value = withSpring(0.8);
        zoneScaleText.value = withSpring(0.8);
        void finalizeUtterance(zone);
      })
      .minDistance(0)
      .manualActivation(false);
  }, [
    startHold,
    getGestureZone,
    finalizeUtterance,
    zoneOpacityCancel,
    zoneOpacityText,
    zoneScaleCancel,
    zoneScaleText,
  ]);
```

- [ ] **Step 7: 渲染手势区域**

在 `voiceDock` 中、waveRow 上方添加区域渲染（约第 818 行附近）：

将原来的 `voiceDock` 部分替换为包含区域的版本。在 `styles.holdHint` 上方插入：

```tsx
            <View style={[styles.voiceDock, { borderTopColor: palette.line }]}>
              {/* 手势区域 */}
              {voiceState === "recording" && (
                <View style={styles.zoneRow}>
                  <Animated.View
                    style={[
                      styles.zone,
                      cancelZoneStyle,
                      { backgroundColor: "rgba(239,68,68,0.12)" },
                    ]}
                  >
                    <Text style={[styles.zoneIcon, { color: "#ef4444" }]}>
                      ×
                    </Text>
                    <Text style={[styles.zoneLabel, { color: "#ef4444" }]}>
                      松开取消
                    </Text>
                  </Animated.View>
                  <Animated.View
                    style={[
                      styles.zone,
                      textZoneStyle,
                      { backgroundColor: `${t.brand}20` },
                    ]}
                  >
                    <Text style={[styles.zoneIcon, { color: t.brand }]}>
                      ⌨
                    </Text>
                    <Text style={[styles.zoneLabel, { color: t.brand }]}>
                      转文字
                    </Text>
                  </Animated.View>
                </View>
              )}

              <Text style={[styles.holdHint, { color: palette.muted }]}>
                {voiceState === "recording"
                  ? activeZone === "cancel"
                    ? "松开手指，取消发送"
                    : activeZone === "text"
                      ? "松开手指，转为文字"
                      : "手指上滑，选择操作"
                  : isAiResponding
                    ? "点击取消"
                    : state === "executing"
                      ? "AI 处理中..."
                      : tr("ai:holdToSpeak")}
              </Text>
```

同时需要在组件函数体内添加 animated style hooks：

在 `panGesture` 之后添加：
```ts
  const cancelZoneStyle = useAnimatedStyle(() => ({
    opacity: zoneOpacityCancel.value,
    transform: [{ scale: zoneScaleCancel.value }],
  }));
  const textZoneStyle = useAnimatedStyle(() => ({
    opacity: zoneOpacityText.value,
    transform: [{ scale: zoneScaleText.value }],
  }));
```

- [ ] **Step 8: 改造麦克风按钮**

将 `Pressable` 按钮区域包裹在 `GestureDetector` 中，并仅在 `state === "idle"` 时启用手势。在 `isAiResponding` 时保持现有的点击取消行为。

将麦克风按钮部分改为：
```tsx
              {state === "idle" ? (
                <GestureDetector gesture={panGesture}>
                  <View
                    style={styles.micGestureArea}
                    onLayout={(e) => {
                      const { x, y, width, height } = e.nativeEvent.layout;
                      micLayoutRef.current = { x, y, width, height };
                    }}
                  >
                    <View
                      style={[
                        styles.micOuter,
                        {
                          borderColor: voiceState === "recording"
                            ? t.brand
                            : palette.line,
                          backgroundColor:
                            voiceState === "recording"
                              ? t.brandSelectedHighlight
                              : t.surfaceElevated,
                        },
                      ]}
                    >
                      <Svg width={28} height={28} viewBox="0 0 24 24">
                        <Path
                          d="M12 14a3 3 0 0 0 3-3V7a3 3 0 0 0-6 0v4a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V20H9v2h6v-2h-2v-2.08A7 7 0 0 0 19 11h-2z"
                          fill={t.brand}
                        />
                      </Svg>
                    </View>
                  </View>
                </GestureDetector>
              ) : (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    isAiResponding ? "取消 AI 回答" : tr("ai:voiceButtonA11y")
                  }
                  onPress={isAiResponding ? abortResponse : undefined}
                  style={({ pressed }) => [
                    styles.micOuter,
                    {
                      borderColor: isAiResponding ? "#ef4444" : palette.line,
                      backgroundColor: t.surfaceElevated,
                      transform: [{ scale: pressed ? 1.04 : 1 }],
                    },
                  ]}
                >
                  {isAiResponding ? (
                    <Svg width={28} height={28} viewBox="0 0 24 24">
                      <Path
                        d="M6 4h4v16H6zm8 0h4v16h-4z"
                        fill="#ef4444"
                      />
                    </Svg>
                  ) : (
                    <Svg width={28} height={28} viewBox="0 0 24 24">
                      <Path
                        d="M12 14a3 3 0 0 0 3-3V7a3 3 0 0 0-6 0v4a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V20H9v2h6v-2h-2v-2.08A7 7 0 0 0 19 11h-2z"
                        fill={t.brand}
                      />
                    </Svg>
                  )}
                </Pressable>
              )}
```

- [ ] **Step 9: 渲染编辑面板**

在 `Modal` 内容结束前（`</>` 之前）添加：
```tsx
      <VoiceEditPanel
        visible={voiceState === "editing"}
        initialText={editText}
        onSend={(text) => {
          setVoiceState("idle");
          if (text) void sendMessage(text);
        }}
        onCancel={() => setVoiceState("idle")}
        theme={{
          surfaceElevated: t.surfaceElevated,
          textPrimary: t.textPrimary,
          textMuted: t.textMuted,
          brand: t.brand,
          divider: t.divider,
        }}
      />
```

- [ ] **Step 10: 添加样式**

在 `StyleSheet.create` 末尾添加：
```ts
  micGestureArea: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  zoneRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 24,
    paddingBottom: 8,
    height: 72,
  },
  zone: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  zoneIcon: {
    fontSize: 24,
    marginBottom: 2,
  },
  zoneLabel: {
    fontFamily: "Manrope_500Medium",
    fontSize: 11,
  },
```

- [ ] **Step 11: 清理旧代码**

删除以下内容：
- `isReleasingRef` 相关逻辑（如果已不需要）— 检查是否被 `Voice.onSpeechEnd` 使用
- `releaseTimeoutRef` 相关逻辑 — 同上
- 旧的 `onPressIn` / `onPressOut` 在 `Pressable` 上的使用（已被手势替代）

注意：保留 `Voice.onSpeechEnd` 中对 `isReleasingRef` 的检查，但调整逻辑使其兼容新流程。

- [ ] **Step 12: TypeScript 类型检查**

Run:
```bash
cd /Users/wangjunjie/Documents/Work/Personal/tempo/app && pnpm exec tsc --noEmit --skipLibCheck
```
Expected: 无错误

- [ ] **Step 13: Commit**

```bash
git add app/modules/ai/components/AiFloatingAssistant.tsx
git commit -m "feat(ai): wechat-style voice gesture interaction with edit panel"
```

---

## Task 4: 清理与回归验证

**Files:**
- Modify: `app/modules/ai/components/AiFloatingAssistant.tsx`（如有遗留问题）

- [ ] **Step 1: 运行测试**

Run:
```bash
cd /Users/wangjunjie/Documents/Work/Personal/tempo/app && pnpm test
```
Expected: 全部通过

- [ ] **Step 2: 检查 lint / tsc**

Run:
```bash
cd /Users/wangjunjie/Documents/Work/Personal/tempo/app && pnpm exec tsc --noEmit --skipLibCheck
```
Expected: 无错误

- [ ] **Step 3: 回归验证现有功能**

快速走查代码确认：
1. AI streaming 时麦克风按钮仍显示红色取消按钮并可点击
2. 正常 idle 状态下按钮外观无变化
3. 打开面板后消息列表仍可滚动

- [ ] **Step 4: Commit（如有修复）**

```bash
git add ...
git commit -m "fix(ai): voice gesture interaction polish"
```

---

## Self-Review

**1. Spec coverage:**
- ✅ 按住麦克风浮现两个扇形区域 — Task 3 Step 7
- ✅ 左上"松开取消"、右上"转文字" — Task 3 Step 7
- ✅ 松手后执行对应操作 — Task 3 Step 5
- ✅ 转文字后弹出底部编辑面板 — Task 2 + Task 3 Step 9
- ✅ 编辑面板可修改、取消、发送 — Task 2
- ✅ 手势区域实时高亮 — Task 3 Step 6

**2. Placeholder scan:** 无 TBD/TODO。

**3. Type consistency:**
- `VoiceState` 类型在 Task 3 Step 2 中定义，与状态机一致
- `activeZone` 类型 `"cancel" | "text" | null` 与 `getGestureZone` 返回值一致
- `VoiceEditPanelProps` 中 `theme` 字段名与调用处一致
