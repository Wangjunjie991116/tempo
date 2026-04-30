import Constants from "expo-constants";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

type Extra = {
  tempoWebBaseUrl?: string;
  tempoApiBaseUrl?: string;
};

const extra = Constants.expoConfig?.extra as Extra | undefined;

const WEB_URL =
  (extra?.tempoWebBaseUrl && extra.tempoWebBaseUrl.trim().length > 0
    ? extra.tempoWebBaseUrl.trim()
    : null) ??
  process.env.EXPO_PUBLIC_WEB_BASE_URL ??
  "http://127.0.0.1:5173";

const API_URL =
  (extra?.tempoApiBaseUrl && extra.tempoApiBaseUrl.trim().length > 0
    ? extra.tempoApiBaseUrl.trim()
    : null) ??
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  "http://127.0.0.1:8000";

const showLocalhostHint =
  __DEV__ &&
  (WEB_URL.includes("127.0.0.1") || WEB_URL.toLowerCase().includes("localhost"));

if (showLocalhostHint) {
  console.warn(
    "[Tempo] WebView URL is localhost. Simulators can use this; physical iPhones need app/.env with EXPO_PUBLIC_* set to your Mac LAN IP. After creating/editing app/.env run: expo start --clear",
  );
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
          <Text style={styles.bannerText}>王俊杰测试</Text>
        </View>
        {showLocalhostHint ? (
          <Text style={styles.hint}>
            当前加载地址：{WEB_URL}
            {"\n"}
            真机请到 app 目录创建 .env（可复制 .env.example），把 EXPO_PUBLIC_WEB_BASE_URL /
            EXPO_PUBLIC_API_BASE_URL 改成 Mac 的局域网 IP，然后执行 expo start --clear 再重载。
          </Text>
        ) : null}
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
  hint: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: "crimson",
    fontSize: 12,
    backgroundColor: "#fff3f3",
  },
  web: { flex: 1 },
});
