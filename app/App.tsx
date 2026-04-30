import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

const WEB_URL = process.env.EXPO_PUBLIC_WEB_BASE_URL ?? "http://127.0.0.1:5173";
const API_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

if (__DEV__) {
  const lower = WEB_URL.toLowerCase();
  if (lower.includes("127.0.0.1") || lower.includes("localhost")) {
    console.warn(
      "[Tempo] WebView URL is localhost. Simulators can use this; physical iPhones must set EXPO_PUBLIC_WEB_BASE_URL (and API) to your Mac LAN IP, same subnet as exp:// in Metro.",
    );
  }
}

export default function App() {
  const injected = `window.__TEMPO_CONFIG__ = ${JSON.stringify({
    apiBaseUrl: API_URL,
  })}; true;`;

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <StatusBar style="dark" />
        <View style={styles.banner}>
          <Text style={styles.bannerText}>Tempo shell · WebView</Text>
        </View>
        <WebView
          style={styles.web}
          source={{ uri: WEB_URL }}
          injectedJavaScriptBeforeContentLoaded={injected}
          javaScriptEnabled
          domStorageEnabled
          originWhitelist={["*"]}
          setSupportMultipleWindows={false}
        />
      </SafeAreaView>
    </SafeAreaProvider>
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
  web: { flex: 1 },
});
