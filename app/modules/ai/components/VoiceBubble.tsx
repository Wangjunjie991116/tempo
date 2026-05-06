import { useCallback, useEffect, useRef, useState } from "react";
import {
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  Text,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import Svg, { Path } from "react-native-svg";

const SCREEN_WIDTH = Dimensions.get("window").width;
const LINE_HEIGHT = 22;
const MIN_LINES = 2;
const MAX_LINES = 4;
const MIN_HEIGHT = LINE_HEIGHT * MIN_LINES + 28;
const MAX_HEIGHT = LINE_HEIGHT * MAX_LINES + 28;

export type VoiceBubbleProps = {
  visible: boolean;
  text: string;
  mode: "recording" | "preview";
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

function CancelIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 6L6 18M6 6l12 12"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function SendIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
        fill="#fff"
        stroke="#fff"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function VoiceBubble({
  visible,
  text,
  mode,
  onSend,
  onCancel,
  theme,
}: VoiceBubbleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editableText, setEditableText] = useState(text);
  const inputRef = useRef<TextInput>(null);
  const bubbleOpacity = useSharedValue(0);
  const bubbleScale = useSharedValue(0.85);
  const bubbleTranslateY = useSharedValue(20);

  useEffect(() => {
    setEditableText(text);
  }, [text]);

  useEffect(() => {
    if (visible) {
      bubbleOpacity.value = withTiming(1, { duration: 200 });
      bubbleScale.value = withSpring(1, { damping: 18, stiffness: 220 });
      bubbleTranslateY.value = withSpring(0, { damping: 18, stiffness: 220 });
    } else {
      bubbleOpacity.value = withTiming(0, { duration: 150 });
      bubbleScale.value = withTiming(0.85, { duration: 150 });
      bubbleTranslateY.value = withTiming(20, { duration: 150 });
      setIsEditing(false);
    }
  }, [visible, bubbleOpacity, bubbleScale, bubbleTranslateY]);

  const handleBubblePress = useCallback(() => {
    if (mode === "preview" && !isEditing) {
      setIsEditing(true);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [mode, isEditing]);

  const handleSend = useCallback(() => {
    const finalText = editableText.trim();
    if (finalText) {
      onSend(finalText);
    }
  }, [editableText, onSend]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: bubbleOpacity.value,
    transform: [
      { scale: bubbleScale.value },
      { translateY: bubbleTranslateY.value },
    ],
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      {Platform.OS === "ios" ? (
        <BlurView
          intensity={40}
          tint="dark"
          style={styles.blurContainer}
        >
          <View style={[styles.bubbleInner, { backgroundColor: "rgba(255,255,255,0.08)" }]}>
            <Pressable onPress={handleBubblePress} style={styles.bubbleContent}>
              {isEditing ? (
                <TextInput
                  ref={inputRef}
                  style={[styles.input, { color: "#fff" }]}
                  value={editableText}
                  onChangeText={setEditableText}
                  multiline
                  autoFocus
                  placeholder="编辑内容..."
                  placeholderTextColor="rgba(255,255,255,0.4)"
                />
              ) : (
                <ScrollView
                  style={styles.scrollView}
                  contentContainerStyle={styles.scrollContent}
                  nestedScrollEnabled
                >
                  <Text style={[styles.text, { color: "#fff" }]}>
                    {text || "正在聆听..."}
                  </Text>
                </ScrollView>
              )}
            </Pressable>

            {mode === "preview" && (
              <View style={styles.buttonRow}>
                <Pressable
                  onPress={onCancel}
                  style={({ pressed }) => [
                    styles.button,
                    styles.buttonCancel,
                    { opacity: pressed ? 0.6 : 1 },
                  ]}
                >
                  <CancelIcon color="rgba(255,255,255,0.7)" />
                  <Text style={[styles.buttonText, { color: "rgba(255,255,255,0.7)" }]}>
                    取消
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleSend}
                  style={({ pressed }) => [
                    styles.button,
                    styles.buttonSend,
                    { opacity: pressed ? 0.85 : 1 },
                  ]}
                >
                  <SendIcon />
                  <Text style={[styles.buttonText, { color: "#fff" }]}>发送</Text>
                </Pressable>
              </View>
            )}
          </View>
        </BlurView>
      ) : (
        <View style={[styles.bubbleInner, { backgroundColor: "#1a1a2e" }]}>
          <Pressable onPress={handleBubblePress} style={styles.bubbleContent}>
            {isEditing ? (
              <TextInput
                ref={inputRef}
                style={[styles.input, { color: "#fff" }]}
                value={editableText}
                onChangeText={setEditableText}
                multiline
                autoFocus
                placeholder="编辑内容..."
                placeholderTextColor="rgba(255,255,255,0.4)"
              />
            ) : (
              <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                nestedScrollEnabled
              >
                <Text style={[styles.text, { color: "#fff" }]}>
                  {text || "正在聆听..."}
                </Text>
              </ScrollView>
            )}
          </Pressable>

          {mode === "preview" && (
            <View style={styles.buttonRow}>
              <Pressable
                onPress={onCancel}
                style={({ pressed }) => [
                  styles.button,
                  styles.buttonCancel,
                  { opacity: pressed ? 0.6 : 1 },
                ]}
              >
                <CancelIcon color="rgba(255,255,255,0.7)" />
                <Text style={[styles.buttonText, { color: "rgba(255,255,255,0.7)" }]}>
                  取消
                </Text>
              </Pressable>
              <Pressable
                onPress={handleSend}
                style={({ pressed }) => [
                  styles.button,
                  styles.buttonSend,
                  { opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <SendIcon />
                <Text style={[styles.buttonText, { color: "#fff" }]}>发送</Text>
              </Pressable>
            </View>
          )}
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 110,
    left: 16,
    right: 16,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
  blurContainer: {
    borderRadius: 20,
    overflow: "hidden",
  },
  bubbleInner: {
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  bubbleContent: {
    minHeight: MIN_HEIGHT,
    maxHeight: MAX_HEIGHT,
    padding: 14,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  text: {
    fontFamily: "Manrope_500Medium",
    fontSize: 16,
    lineHeight: LINE_HEIGHT,
    letterSpacing: 0.2,
  },
  input: {
    flex: 1,
    fontFamily: "Manrope_500Medium",
    fontSize: 16,
    lineHeight: LINE_HEIGHT,
    textAlignVertical: "top",
    padding: 0,
    letterSpacing: 0.2,
  },
  buttonRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  button: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
  },
  buttonCancel: {
    backgroundColor: "transparent",
    borderRightWidth: 1,
    borderRightColor: "rgba(255,255,255,0.1)",
  },
  buttonSend: {
    backgroundColor: "#6065e6",
  },
  buttonText: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 15,
    letterSpacing: 0.3,
  },
});
