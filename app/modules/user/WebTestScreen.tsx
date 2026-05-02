import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import {
  TEMPO_INJECTED_JS_BEFORE_LOAD,
  TEMPO_SHOW_LOCALHOST_WEB_HINT,
  TEMPO_WEB_URL,
} from "../../core/config/tempoWebConfig";

export default function WebTestScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={["left", "right", "bottom"]}>
      <View style={styles.banner}>
        <Text style={styles.bannerText}>H5 联调 · WebView</Text>
      </View>
      {TEMPO_SHOW_LOCALHOST_WEB_HINT ? (
        <Text style={styles.hint}>
          当前加载地址：{TEMPO_WEB_URL}
          {"\n"}
          真机在仓库根目录执行 pnpm sync:lan-env（会创建/更新 app/.env.dev），或手动配置
          EXPO_PUBLIC_* 为 Mac 局域网 IP，然后 expo start --clear。
        </Text>
      ) : null}
      <WebView
        style={styles.web}
        source={{ uri: TEMPO_WEB_URL }}
        injectedJavaScriptBeforeContentLoaded={TEMPO_INJECTED_JS_BEFORE_LOAD}
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
  hint: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: "crimson",
    fontSize: 12,
    backgroundColor: "#fff3f3",
  },
  web: { flex: 1 },
});
