import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { apiLogin } from "../../modules/auth/api";

const AUTH_STORAGE_KEY = "tempo.auth_session";

/** 硬编码白名单（用于演示快速登录）。 */
const WHITELIST: Record<string, string> = {
  "2638241171@qq.com": "Wjj13055578801---",
};

type SessionUser = {
  id: string;
  email: string;
  full_name?: string | null;
};

type SessionValue = {
  isAuthenticated: boolean;
  user: SessionUser | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 冷启动时从 AsyncStorage 恢复会话
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
        if (raw && !cancelled) {
          const parsed = JSON.parse(raw) as SessionUser;
          setUser(parsed);
        }
      } catch {
        // ignore parse errors
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    // 白名单直接通过（无需后端）
    if (WHITELIST[email] === password) {
      const whitelistUser: SessionUser = {
        id: "whitelist-user",
        email,
        full_name: "Admin",
      };
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(whitelistUser));
      setUser(whitelistUser);
      return;
    }

    const loggedInUser = await apiLogin(email, password);
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(loggedInUser));
    setUser(loggedInUser);
  }, []);

  const signOut = useCallback(async () => {
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      isAuthenticated: !!user,
      user,
      isLoading,
      signIn,
      signOut,
    }),
    [user, isLoading, signIn, signOut],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSession must be used within SessionProvider");
  }
  return ctx;
}
