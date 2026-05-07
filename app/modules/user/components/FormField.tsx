import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  type TextInputProps,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export interface FormFieldProps {
  /** 上方灰色标签 */
  label: string;
  /** 输入值 */
  value: string;
  /** 文本变化回调 */
  onChangeText?: (text: string) => void;
  /** 点击回调（用于日期选择等，此时输入框不可编辑） */
  onPress?: () => void;
  /** 占位符 */
  placeholder?: string;
  /** 键盘类型 */
  keyboardType?: "default" | "email-address" | "phone-pad";
  /** 密码输入，带眼睛图标切换 */
  secureTextEntry?: boolean;
  /** 右侧图标名称（MaterialCommunityIcons） */
  rightIcon?: string;
  /** 左侧自定义元素（如区号选择器） */
  leftElement?: React.ReactNode;
  /** 是否可编辑，默认可编辑 */
  editable?: boolean;
}

/**
 * 表单输入字段组件。
 *
 * 支持标签、密码可见性切换、右侧图标、左侧自定义元素及点击模式。
 */
export function FormField({
  label,
  value,
  onChangeText,
  onPress,
  placeholder,
  keyboardType = "default",
  secureTextEntry = false,
  rightIcon,
  leftElement,
  editable = true,
}: FormFieldProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const isPressable = !!onPress;
  const isEditable = editable && !isPressable;
  const effectiveSecureTextEntry = secureTextEntry && !isPasswordVisible;

  const inputRowStyle = [
    styles.inputRow,
    isFocused && styles.inputRowFocused,
  ];

  const renderRightElement = () => {
    if (secureTextEntry) {
      return (
        <Pressable
          onPress={() => setIsPasswordVisible((prev) => !prev)}
          testID="password-toggle"
        >
          <MaterialCommunityIcons
            name={isPasswordVisible ? "eye-off-outline" : "eye-outline"}
            size={20}
            color="#444444"
          />
        </Pressable>
      );
    }

    if (rightIcon) {
      return (
        <MaterialCommunityIcons
          name={rightIcon as any}
          size={20}
          color="#444444"
        />
      );
    }

    return null;
  };

  const inputContent = (
    <View style={inputRowStyle}>
      {leftElement}
      {isPressable ? (
        <Text style={styles.inputText}>{value}</Text>
      ) : (
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#A5A5A5"
          keyboardType={keyboardType}
          secureTextEntry={effectiveSecureTextEntry}
          editable={isEditable}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
      )}
      {renderRightElement()}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      {isPressable ? (
        <Pressable onPress={onPress}>{inputContent}</Pressable>
      ) : (
        inputContent
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  label: {
    fontFamily: "Manrope_400Regular",
    fontSize: 12,
    color: "#A5A5A5",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D7D7D7",
    borderRadius: 12,
  },
  inputRowFocused: {
    borderColor: "#151515",
  },
  input: {
    flex: 1,
    fontFamily: "Manrope_500Medium",
    fontSize: 16,
    color: "#151515",
    padding: 0,
  },
  inputText: {
    flex: 1,
    fontFamily: "Manrope_500Medium",
    fontSize: 16,
    color: "#151515",
  },
});
