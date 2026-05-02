import { createContext, useContext, useMemo, type ReactNode } from "react";
import { Provider as PaperProvider } from "react-native-paper";
import { buildPaperTheme } from "./paperTheme";
import { buildSemanticLight } from "./semantic";
import type { TempoSemantic } from "./semantic";

const TempoSemanticContext = createContext<TempoSemantic | null>(null);

export function TempoThemeProvider({ children }: { children: ReactNode }) {
  const semantic = useMemo(() => buildSemanticLight(), []);
  const paperTheme = useMemo(() => buildPaperTheme(semantic), [semantic]);
  return (
    <TempoSemanticContext.Provider value={semantic}>
      <PaperProvider theme={paperTheme}>{children}</PaperProvider>
    </TempoSemanticContext.Provider>
  );
}

export function useTempoTheme(): TempoSemantic {
  const v = useContext(TempoSemanticContext);
  if (!v) throw new Error("useTempoTheme must be used within TempoThemeProvider");
  return v;
}
