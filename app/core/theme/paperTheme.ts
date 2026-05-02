import { configureFonts, MD3LightTheme } from "react-native-paper";
import type { TempoSemantic } from "./semantic";

const fontConfig = {
  bodyLarge: { fontFamily: "Manrope_400Regular", fontWeight: "400" as const },
  bodyMedium: { fontFamily: "Manrope_500Medium", fontWeight: "500" as const },
  bodySmall: { fontFamily: "Manrope_400Regular", fontWeight: "400" as const },
  titleMedium: { fontFamily: "Manrope_600SemiBold", fontWeight: "600" as const },
  titleLarge: { fontFamily: "Manrope_600SemiBold", fontWeight: "600" as const },
  labelLarge: { fontFamily: "Manrope_600SemiBold", fontWeight: "600" as const },
};

export function buildPaperTheme(semantic: TempoSemantic) {
  const base = MD3LightTheme;
  return {
    ...base,
    fonts: configureFonts({ config: fontConfig }),
    colors: {
      ...base.colors,
      primary: semantic.brand,
      background: semantic.screenBg,
      surface: semantic.screenBg,
      onSurface: semantic.textPrimary,
      outline: semantic.divider,
    },
    roundness: semantic.radius.md,
  };
}
