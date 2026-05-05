import { useState } from "react";
import { View, TextInput, Text, StyleSheet, Pressable } from "react-native";
import { Eye, EyeOff } from "lucide-react-native";

type Props = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  placeholder?: string;
  keyboardType?: "default" | "email-address";
};

export function AuthInput({
  label,
  value,
  onChangeText,
  secureTextEntry,
  placeholder,
  keyboardType,
}: Props) {
  const [isFocused, setIsFocused] = useState(false);
  const [isVisible, setIsVisible] = useState(!secureTextEntry);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputRow, isFocused && styles.inputRowFocused]}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry && !isVisible}
          placeholder={placeholder}
          placeholderTextColor="#A5A5A5"
          keyboardType={keyboardType}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          autoCapitalize="none"
        />
        {secureTextEntry && (
          <Pressable onPress={() => setIsVisible((v) => !v)} hitSlop={8}>
            {isVisible ? (
              <Eye size={20} color="#444444" />
            ) : (
              <EyeOff size={20} color="#444444" />
            )}
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  label: {
    fontFamily: "Manrope_400Regular",
    fontSize: 12,
    lineHeight: 16,
    color: "#A5A5A5",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 6,
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
    fontSize: 14,
    lineHeight: 22,
    color: "#151515",
    padding: 0,
  },
});
