import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronRight } from "lucide-react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AUTH_STACK, ROOT_STACK } from "../../core/navigation/routes";
import type { RootStackParamList } from "../../core/navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, typeof ROOT_STACK.Onboarding>;

export default function OnboardingScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* Background gradient */}
      <LinearGradient
        colors={["#6065E6", "#60A7E6"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Background image */}
      <Image
        source={require("../../assets/images/onboarding-bg.png")}
        style={[StyleSheet.absoluteFill, { opacity: 0.4 }]}
        resizeMode="cover"
      />

      {/* Overlay gradient */}
      <LinearGradient
        colors={["rgba(96,101,230,0)", "rgba(52,59,223,0.69)", "rgba(52,59,223,1)"]}
        locations={[0.23, 0.63, 0.83]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Floating card */}
      <View style={styles.cardContainer}>
        <BlurView intensity={20} tint="dark" style={styles.cardBlur}>
          <View style={styles.card}>
            {/* Placeholder content */}
            <View style={styles.cardPlaceholder}>
              <View style={styles.placeholderRow}>
                <View style={styles.placeholderBarShort} />
                <View style={styles.placeholderBarLong} />
              </View>
              <View style={styles.placeholderRow}>
                <View style={styles.placeholderDot} />
                <View style={styles.placeholderBarMid} />
              </View>
            </View>

            {/* Footer: avatars + chevron */}
            <View style={styles.cardFooter}>
              <View style={styles.avatarStack}>
                <View style={styles.avatar} />
                <View style={styles.avatar} />
                <View style={styles.avatar} />
                <View style={styles.avatarCount}>
                  <Text style={styles.avatarCountText}>+6</Text>
                </View>
              </View>
              <ChevronRight size={24} color="#FFFFFF" />
            </View>
          </View>
        </BlurView>
      </View>

      {/* Bottom content */}
      <View style={[styles.bottomContent, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        {/* Carousel indicators */}
        <View style={styles.slider}>
          <View style={styles.sliderActive} />
          <View style={styles.sliderDot} />
          <View style={styles.sliderDot} />
        </View>

        {/* Headline */}
        <View style={styles.headline}>
          <Text style={styles.title}>Easily Schedule Meetings</Text>
        </View>

        {/* Buttons */}
        <Pressable
          style={styles.primaryBtn}
          onPress={() => navigation.navigate(ROOT_STACK.Auth, { screen: AUTH_STACK.SignUp })}
        >
          <Text style={styles.primaryBtnText}>Create Account</Text>
        </Pressable>

        <Pressable
          style={styles.secondaryBtn}
          onPress={() => navigation.navigate(ROOT_STACK.Auth, { screen: AUTH_STACK.Login })}
        >
          <Text style={styles.secondaryBtnText}>Log in</Text>
        </Pressable>

        {/* Home Indicator */}
        <View style={styles.homeIndicator} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  cardContainer: {
    position: "absolute",
    right: 24,
    top: "38%",
    width: 209,
  },
  cardBlur: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  card: {
    padding: 12,
    gap: 12,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  cardPlaceholder: { gap: 8 },
  placeholderRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  placeholderBarShort: {
    width: 48,
    height: 10,
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  placeholderBarLong: {
    width: 94,
    height: 10,
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  placeholderDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  placeholderBarMid: {
    width: 121,
    height: 10,
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.12)",
  },
  avatarStack: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#909BED",
    marginLeft: -8,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.12)",
  },
  avatarCount: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#909BED",
    marginLeft: -8,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarCountText: {
    fontFamily: "Manrope_500Medium",
    fontSize: 8,
    lineHeight: 16,
    color: "#FFFFFF",
    opacity: 0.4,
  },
  bottomContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 24,
    alignItems: "center",
    gap: 8,
  },
  slider: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },
  sliderActive: {
    width: 40,
    height: 10,
    borderRadius: 99,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  sliderDot: {
    width: 40,
    height: 10,
    borderRadius: 99,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  headline: {
    paddingVertical: 16,
    paddingHorizontal: 0,
  },
  title: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 32,
    lineHeight: 38,
    color: "#FFFFFF",
    textAlign: "center",
  },
  primaryBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "stretch",
    paddingVertical: 14,
    paddingHorizontal: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
  },
  primaryBtnText: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 18,
    lineHeight: 26,
    color: "#444444",
  },
  secondaryBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "stretch",
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 24,
  },
  secondaryBtnText: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 18,
    lineHeight: 26,
    color: "#FFFFFF",
  },
  homeIndicator: {
    width: 134,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#FFFFFF",
    marginTop: 8,
    alignSelf: "center",
    opacity: 0.3,
  },
});
