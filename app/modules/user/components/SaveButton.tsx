import React from "react";
import {
  Pressable,
  Text,
  StyleSheet,
  type PressableProps,
} from "react-native";

export interface SaveButtonProps extends PressableProps {
  /** 按钮文字 */
  title: string;
}

/**
 * 保存按钮组件。
 *
 * 启用态背景色 #151515，禁用态 #A5A5A5；白色文字，pill 圆角。
 */
export function SaveButton({ title, disabled, onPress, ...rest }: SaveButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      {...rest}
      style={({ pressed }) => [
        styles.button,
        disabled ? styles.disabled : styles.enabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Text style={styles.text}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 16,
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 25,
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
  },
  enabled: {
    backgroundColor: "#151515",
  },
  disabled: {
    backgroundColor: "#A5A5A5",
  },
  pressed: {
    opacity: 0.9,
  },
  text: {
    color: "#FFFFFF",
    fontFamily: "Manrope_600SemiBold",
    fontSize: 16,
  },
});
