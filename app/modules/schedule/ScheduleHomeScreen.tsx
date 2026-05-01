import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ScheduleHomeScreen() {
  return (
    <SafeAreaView style={styles.root} edges={["top", "left", "right"]}>
      <View style={styles.center}>
        <Text style={styles.title}>日程</Text>
        <Text style={styles.sub}>RN 占位 · 待接 Figma</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  title: { fontSize: 22, fontWeight: "600", marginBottom: 8 },
  sub: { fontSize: 14, opacity: 0.55 },
});
