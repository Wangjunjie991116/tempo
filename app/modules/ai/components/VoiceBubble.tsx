import { useCallback, useEffect, useRef, useState } from "react";
import {
  Dimensions,
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
import Svg, { Path } from "react-native-svg";

const SCREEN_WIDTH = Dimensions.get("window").width;
const LINE_HEIGHT = 22;
const MIN_LINES = 2;
const MAX_LINES = 4;
const MIN_HEIGHT = LINE_HEIGHT * MIN_LINES + 24; // 44 + padding
const MAX_HEIGHT = LINE_HEIGHT * MAX_LINES + 24; // 88 + padding

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
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 6L6 18M6 6l12 12"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function SendIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
        stroke={color}
        strokeWidth={2}
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
  const bubbleScale = useSharedValue(0.9);

  useEffect(() => {
    setEditableText(text);
  }, [text]);

  useEffect(() => {
    if (visible) {
      bubbleOpacity.value = withTiming(1, { duration: 150 });
      bubbleScale.value = withSpring(1, { damping: 20, stiffness: 200 });
    } else {
      bubbleOpacity.value = withTiming(0, { duration: 120 });
      bubbleScale.value = withTiming(0.9, { duration: 120 });
      setIsEditing(false);
    }
  }, [visible, bubbleOpacity, bubbleScale]);

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
    transform: [{ scale: bubbleScale.value }],
  }));

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: theme.surfaceElevated },
        animatedStyle,
      ]}
    >
      <Pressable onPress={handleBubblePress} style={styles.bubbleContent}>
        {isEditing ? (
          <TextInput
            ref={inputRef}
            style={[styles.input, { color: theme.textPrimary }]}
            value={editableText}
            onChangeText={setEditableText}
            multiline
            autoFocus
          />
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            nestedScrollEnabled
          >
            <Text style={[styles.text, { color: theme.textPrimary }]}>
              {text || " "}
            </Text>
          </ScrollView>
        )}
      </Pressable>

      {mode === "preview" && (
        <View style={[styles.buttonRow, { borderTopColor: theme.divider }]}>
          <Pressable
            onPress={onCancel}
            style={({ pressed }) => [
              styles.button,
              styles.buttonCancel,
              { opacity: pressed ? 0.7 : 1, borderColor: theme.divider },
            ]}
          >
            <CancelIcon color={theme.textMuted} />
            <Text style={[styles.buttonText, { color: theme.textMuted }]}>
              取消
            </Text>
          </Pressable>
          <Pressable
            onPress={handleSend}
            style={({ pressed }) => [
              styles.button,
              styles.buttonSend,
              { backgroundColor: theme.brand, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <SendIcon color="#fff" />
            <Text style={[styles.buttonText, { color: "#fff" }]}>发送</Text>
          </Pressable>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 100, // Above the mic button
    left: 16,
    right: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: "hidden",
  },
  bubbleContent: {
    minHeight: MIN_HEIGHT,
    maxHeight: MAX_HEIGHT,
    padding: 12,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  text: {
    fontFamily: "Manrope_400Regular",
    fontSize: 15,
    lineHeight: LINE_HEIGHT,
  },
  input: {
    flex: 1,
    fontFamily: "Manrope_400Regular",
    fontSize: 15,
    lineHeight: LINE_HEIGHT,
    textAlignVertical: "top",
    padding: 0,
  },
  buttonRow: {
    flexDirection: "row",
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  button: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
  },
  buttonCancel: {
    borderWidth: 0,
  },
  buttonSend: {
    borderRadius: 0,
  },
  buttonText: {
    fontFamily: "Manrope_500Medium",
    fontSize: 14,
  },
});
