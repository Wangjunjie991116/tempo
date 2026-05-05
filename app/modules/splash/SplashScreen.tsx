import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef } from "react";
import {
  Animated,
  Image,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useTranslation } from "../../core/i18n";
import { useSession } from "../../core/session";
import { AUTH_STACK, MAIN_STACK, ROOT_STACK, SCHEDULE_STACK } from "../../core/navigation/routes";
import type { RootStackParamList } from "../../core/navigation/types";

const SPLASH_VISIBLE_MS = 2000;
const SPLASH_FADE_MS = 420;

type Props = NativeStackScreenProps<RootStackParamList, typeof ROOT_STACK.Splash>;

export default function SplashScreen({ navigation }: Props) {
  const { isAuthenticated, isLoading } = useSession();
  const { t } = useTranslation(["common"]);
  const splashOpacity = useRef(new Animated.Value(1)).current;
  const authRef = useRef(isAuthenticated);
  authRef.current = isAuthenticated;

  useEffect(() => {
    if (isLoading) return;
    const timer = setTimeout(() => {
      Animated.timing(splashOpacity, {
        toValue: 0,
        duration: SPLASH_FADE_MS,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!finished) return;
        if (authRef.current) {
          navigation.replace(ROOT_STACK.Main, {
            screen: MAIN_STACK.Schedule,
            params: { screen: SCHEDULE_STACK.ScheduleHome },
          });
        } else {
          navigation.replace(ROOT_STACK.Onboarding);
        }
      });
    }, SPLASH_VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [splashOpacity, navigation, isLoading]);

  return (
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
            accessibilityLabel={t("common:splashAccessibilityLabel")}
            source={require("../../assets/tempo-icon.png")}
            style={styles.splashIcon}
          />
        </View>
        <Text style={styles.splashTitle}>{t("common:splashTitle")}</Text>
        <Text style={styles.splashSubtitle}>{t("common:splashSubtitle")}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  splashWrap: {
    ...StyleSheet.absoluteFillObject,
    flex: 1,
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
