import { Pressable, Text, StyleSheet, type PressableProps, type ViewStyle } from "react-native";

type Variant = "primary" | "tertiary";

type Props = Omit<PressableProps, "style"> & {
  title: string;
  variant?: Variant;
  style?: ViewStyle;
};

export function AuthButton({ title, variant = "primary", style, ...rest }: Props) {
  return (
    <Pressable style={({ pressed }) => [styles.base, styles[variant], style, pressed && { opacity: 0.9 }]} {...rest}>
      <Text style={[styles.textBase, styles[`${variant}Text` as const]]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "stretch",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 24,
  },
  primary: {
    backgroundColor: "#151515",
  },
  tertiary: {
    backgroundColor: "transparent",
    paddingVertical: 6,
  },
  textBase: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 16,
    lineHeight: 24,
  },
  primaryText: {
    color: "#FFFFFF",
  },
  tertiaryText: {
    fontFamily: "Manrope_500Medium",
    fontSize: 12,
    lineHeight: 16,
    color: "#575757",
  },
});
