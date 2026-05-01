import Constants from "expo-constants";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  StyleSheet,
  Text,
  View,
} from "react-native";
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

const SPLASH_VISIBLE_MS = 2000;
const SPLASH_FADE_MS = 420;

const showLocalhostHint =
  __DEV__ &&
  (WEB_URL.includes("127.0.0.1") || WEB_URL.toLowerCase().includes("localhost"));

if (showLocalhostHint) {
  console.warn(
    "[Tempo] WebView URL is localhost. Simulators can use this; physical iPhones need app/.env with EXPO_PUBLIC_* set to your Mac LAN IP. After creating/editing app/.env run: expo start --clear",
  );
}

export default function App() {
  const [splashVisible, setSplashVisible] = useState(true);
  const splashOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(splashOpacity, {
        toValue: 0,
        duration: SPLASH_FADE_MS,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setSplashVisible(false);
      });
    }, SPLASH_VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [splashOpacity]);

  const injected = `window.__TEMPO_CONFIG__ = ${JSON.stringify({
    apiBaseUrl: API_URL,
  })}; true;`;

  return (
    <SafeAreaProvider>
      <View style={styles.root}>
        <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
          <StatusBar style="dark" />
          <View style={styles.banner}>
            <Text style={styles.bannerText}>轻程 · Tempo · WebView</Text>
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

        {splashVisible ? (
          <Animated.View
            style={[styles.splashWrap, { opacity: splashOpacity }]}
            pointerEvents="auto"
          >
            <LinearGradient
              colors={["#c7d7ff", "#e8ecff", "#f4f0ff", "#dce8ff"]}
              locations={[0, 0.35, 0.65, 1]}
              start={{ x: 0.1, y: 0 }}
              end={{ x: 0.9, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <BlurView intensity={72} tint="light" style={StyleSheet.absoluteFill}>
              <LinearGradient
                colors={[
                  "rgba(255,255,255,0.72)",
                  "rgba(255,255,255,0.08)",
                  "rgba(255,255,255,0.05)",
                  "rgba(120,140,200,0.28)",
                ]}
                locations={[0, 0.42, 0.58, 1]}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
            </BlurView>
            <LinearGradient
              pointerEvents="none"
              colors={[
                "rgba(255,255,255,0.65)",
                "transparent",
                "transparent",
                "rgba(35,45,90,0.38)",
              ]}
              locations={[0, 0.28, 0.72, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[StyleSheet.absoluteFill, styles.edgeVignette]}
            />
            <LinearGradient
              pointerEvents="none"
              colors={["rgba(20,30,70,0.22)", "transparent", "rgba(20,30,70,0.18)"]}
              locations={[0, 0.5, 1]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={[StyleSheet.absoluteFill, styles.edgeVignette]}
            />
            <View style={styles.splashCenter} pointerEvents="none">
              <View style={styles.iconShadowWrap}>
                <Image
                  accessibilityLabel="轻程"
                  source={require("./assets/tempo-icon.png")}
                  style={styles.splashIcon}
                />
              </View>
              <Text style={styles.splashTitle}>轻程</Text>
              <Text style={styles.splashSubtitle}>Tempo</Text>
            </View>
          </Animated.View>
        ) : null}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fff" },
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
  splashWrap: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    backgroundColor: "#e8ecff",
  },
  edgeVignette: { opacity: 1 },
  splashCenter: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 48,
  },
  iconShadowWrap: {
    shadowColor: "#1c2748",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.28,
    shadowRadius: 24,
    elevation: 16,
  },
  splashIcon: {
    width: 112,
    height: 112,
    borderRadius: 26,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.85)",
  },
  splashTitle: {
    marginTop: 20,
    fontSize: 28,
    fontWeight: "700",
    color: "#1a223d",
    letterSpacing: 8,
  },
  splashSubtitle: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: "500",
    color: "rgba(26,34,61,0.55)",
    letterSpacing: 3,
  },
});
