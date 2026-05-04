import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type ToastType = "info" | "success" | "error";

export type ToastConfig = {
  type: ToastType;
  text1: string;
  text2?: string;
  visibilityTime?: number;
};

type ToastActions = {
  show: (config: ToastConfig) => void;
  hide: () => void;
};

let globalToastRef: ToastActions | null = null;

const BG_COLORS: Record<ToastType, string> = {
  info: "#6065e6",
  success: "#22c55e",
  error: "#ef4444",
};

const ToastInternalContext = createContext<{
  config: ToastConfig | null;
  visible: boolean;
  animValue: Animated.Value;
} | null>(null);

function ToastUI({
  config,
  animValue,
  insets,
}: {
  config: ToastConfig;
  animValue: Animated.Value;
  insets: { top: number };
}) {
  const translateY = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-120, 0],
  });

  const opacity = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.container,
        {
          paddingTop: insets.top + 12,
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <View
        style={[
          styles.toast,
          { backgroundColor: BG_COLORS[config.type] },
        ]}
      >
        <Text style={styles.text1}>{config.text1}</Text>
        {config.text2 ? (
          <Text style={styles.text2}>{config.text2}</Text>
        ) : null}
      </View>
    </Animated.View>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const [config, setConfig] = useState<ToastConfig | null>(null);
  const [visible, setVisible] = useState(false);
  const animValue = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    animValue.stopAnimation();
    Animated.timing(animValue, {
      toValue: 0,
      duration: 200,
      easing: Easing.in(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      setVisible(false);
      setConfig(null);
    });
  }, [animValue]);

  const show = useCallback(
    (next: ToastConfig) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      animValue.stopAnimation();
      setConfig(next);
      setVisible(true);

      Animated.timing(animValue, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();

      const duration = next.visibilityTime ?? 2500;
      timerRef.current = setTimeout(() => {
        hide();
      }, duration);
    },
    [animValue, hide],
  );

  useEffect(() => {
    globalToastRef = { show, hide };
    return () => {
      globalToastRef = null;
    };
  }, [show, hide]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return (
    <ToastInternalContext.Provider value={{ config, visible, animValue }}>
      {children}
      <Modal
        transparent
        visible={visible}
        animationType="fade"
        statusBarTranslucent
      >
        {config && (
          <ToastUI config={config} animValue={animValue} insets={insets} />
        )}
      </Modal>
    </ToastInternalContext.Provider>
  );
}

export function ToastRenderer() {
  const ctx = useContext(ToastInternalContext);
  const insets = useSafeAreaInsets();
  if (!ctx || !ctx.visible || !ctx.config) return null;
  return (
    <ToastUI config={ctx.config} animValue={ctx.animValue} insets={insets} />
  );
}

export const Toast: ToastActions = {
  show(config: ToastConfig) {
    globalToastRef?.show(config);
  },
  hide() {
    globalToastRef?.hide();
  },
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 9999,
  },
  toast: {
    maxWidth: Dimensions.get("window").width * 0.88,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  text1: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 14,
    lineHeight: 20,
    color: "#fff",
  },
  text2: {
    fontFamily: "Manrope_500Medium",
    fontSize: 12,
    lineHeight: 18,
    color: "rgba(255,255,255,0.82)",
    marginTop: 2,
  },
});
