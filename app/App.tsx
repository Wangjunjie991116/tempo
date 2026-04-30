import { StatusBar } from "expo-status-bar";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";

const WEB_URL = process.env.EXPO_PUBLIC_WEB_BASE_URL ?? "http://127.0.0.1:5173";
const API_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

export default function App() {
  const injected = `window.__TEMPO_CONFIG__ = ${JSON.stringify({
    apiBaseUrl: API_URL,
  })}; true;`;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <View style={styles.banner}>
        <Text style={styles.bannerText}>Tempo shell · WebView</Text>
      </View>
      <WebView
        source={{ uri: WEB_URL }}
        injectedJavaScriptBeforeContentLoaded={injected}
        javaScriptEnabled
        domStorageEnabled
        originWhitelist={["*"]}
        setSupportMultipleWindows={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  banner: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#ddd",
  },
  bannerText: { fontSize: 12, opacity: 0.7 },
});
