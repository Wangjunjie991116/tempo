import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/** Placeholder — Task 8 替换为 Paper Appbar + Segment + List */
export default function NotificationInboxScreen() {
  return (
    <SafeAreaView style={styles.root} edges={["top", "left", "right"]}>
      <View style={styles.center}>
        <Text style={styles.title}>Notifications</Text>
        <Text style={styles.sub}>Placeholder · Task 8</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  title: { fontSize: 18, fontWeight: "600" },
  sub: { fontSize: 14, opacity: 0.55, marginTop: 8 },
});
