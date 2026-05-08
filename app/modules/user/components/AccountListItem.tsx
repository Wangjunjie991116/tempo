import React from "react";
import {
  Pressable,
  Text,
  Image,
  StyleSheet,
  View,
  type ImageSourcePropType,
  type PressableProps,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export interface AccountListItemProps extends PressableProps {
  /** 变体类型 */
  variant: "profile" | "nav" | "action";
  /** 标题文字 */
  title: string;
  /** 副标题文字 */
  subtitle?: string;
  /** 右侧显示的值 */
  value?: string;
  /** react-native-paper 的 MaterialCommunityIcons 名称 */
  icon?: string;
  /** 头像图片 */
  avatar?: ImageSourcePropType;
  /** 自定义文字颜色 */
  textColor?: string;
  /** 点击回调 */
  onPress?: () => void;
}

/**
 * 账户列表项组件。
 *
 * 支持 profile / nav / action 三种变体，用于账户设置页面。
 */
export function AccountListItem({
  variant,
  title,
  subtitle,
  value,
  icon,
  avatar,
  textColor,
  onPress,
  ...rest
}: AccountListItemProps) {
  const titleStyle = textColor ? { color: textColor } : undefined;

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      {...rest}
      style={({ pressed }) => [styles.container, pressed && onPress && styles.pressed]}
    >
      {/* Left */}
      {variant === "profile" && avatar && (
        <Image source={avatar} style={styles.avatar} />
      )}
      {variant === "nav" && icon && (
        <MaterialCommunityIcons name={icon as any} size={22} color="#151515" />
      )}

      {/* Middle */}
      <View style={[styles.middle, variant === "action" && styles.middleCenter]}>
        <Text style={[styles.title, titleStyle, variant === "action" && styles.titleCenter]}>{title}</Text>
        {variant === "profile" && subtitle && (
          <Text style={styles.subtitle}>{subtitle}</Text>
        )}
      </View>

      {/* Right */}
      {variant === "nav" && value && (
        <Text style={styles.value}>{value}</Text>
      )}
      {(variant === "profile" || variant === "nav") && (
        <MaterialCommunityIcons
          name="chevron-right"
          size={20}
          color="#A5A5A5"
        />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 12,
  },
  pressed: {
    opacity: 0.7,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  middle: {
    flex: 1,
    justifyContent: "center",
  },
  middleCenter: {
    alignItems: "center",
  },
  title: {
    fontFamily: "Manrope_500Medium",
    fontSize: 16,
    color: "#151515",
  },
  titleCenter: {
    textAlign: "center",
  },
  subtitle: {
    fontFamily: "Manrope_400Regular",
    fontSize: 14,
    color: "#575757",
    marginTop: 2,
  },
  value: {
    fontFamily: "Manrope_400Regular",
    fontSize: 14,
    color: "#575757",
  },
});
