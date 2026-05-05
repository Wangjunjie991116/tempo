import { View, Text, StyleSheet } from "react-native";
import { Check } from "lucide-react-native";

type Props = {
  items: string[];
};

export function PasswordRequirements({ items }: Props) {
  return (
    <View style={styles.container}>
      {items.map((item) => (
        <View key={item} style={styles.row}>
          <Check size={16} color="#444444" strokeWidth={2.5} />
          <Text style={styles.text}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 4 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  text: {
    fontFamily: "Manrope_500Medium",
    fontSize: 14,
    lineHeight: 22,
    color: "#A5A5A5",
  },
});
