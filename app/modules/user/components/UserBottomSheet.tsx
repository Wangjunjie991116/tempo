import React from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  type PressableProps,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export interface UserBottomSheetProps {
  /** 是否显示 */
  visible: boolean;
  /** 标题 */
  title: string;
  /** 关闭回调 */
  onClose: () => void;
  /** 子内容 */
  children: React.ReactNode;
}

/**
 * 用户页面通用底部弹窗组件。
 *
 * @example
 * ```tsx
 * <UserBottomSheet visible title="Language" onClose={() => setVisible(false)}>
 *   <BottomSheetItem title="English" selected onPress={() => {}} />
 * </UserBottomSheet>
 * ```
 */
export function UserBottomSheet({
  visible,
  title,
  onClose,
  children,
}: UserBottomSheetProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.sheet}>
          <View style={styles.handleBar} />

          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>

          {children}
        </View>
      </Pressable>
    </Modal>
  );
}

export interface BottomSheetItemProps extends PressableProps {
  /** 左侧图标 */
  icon?: React.ReactNode;
  /** 标题 */
  title: string;
  /** 是否选中 */
  selected?: boolean;
  /** 点击回调 */
  onPress: () => void;
  /** 是否禁用 */
  disabled?: boolean;
}

/**
 * 底部弹窗选项项。
 *
 * @example
 * ```tsx
 * <BottomSheetItem title="English" selected onPress={() => {}} />
 * <BottomSheetItem title="中文" disabled onPress={() => {}} />
 * ```
 */
export function BottomSheetItem({
  icon,
  title,
  selected,
  onPress,
  disabled,
}: BottomSheetItemProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.itemContainer, disabled && styles.itemDisabled]}
    >
      {icon}
      <Text style={[styles.itemTitle, disabled && styles.itemTitleDisabled]}>
        {title}
      </Text>
      {selected && (
        <View style={styles.checkCircle}>
          <MaterialCommunityIcons name="check" size={14} color="#FFFFFF" />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 34,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D7D7D7",
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  title: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 18,
    color: "#151515",
    flex: 1,
    textAlign: "center",
  },
  closeBtn: {
    padding: 4,
  },
  closeText: {
    fontSize: 18,
    color: "#151515",
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 12,
  },
  itemDisabled: {
    opacity: 0.4,
  },
  itemTitle: {
    fontFamily: "Manrope_500Medium",
    fontSize: 16,
    color: "#151515",
    flex: 1,
  },
  itemTitleDisabled: {
    color: "#A5A5A5",
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#6065E6",
    alignItems: "center",
    justifyContent: "center",
  },
});
