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
