import { useEffect } from "react";
import { useSession } from "../session";
import { ROOT_STACK } from "./routes";
import { navigationRef } from "./navigationRef";

/**
 * Keeps root stack in sync with session: after sign-in leave Auth/Onboarding; after sign-out leave Main.
 * Skips while Splash is active.
 */
export function AuthNavigationSync() {
  const { isAuthenticated } = useSession();

  useEffect(() => {
    if (!navigationRef.isReady()) return;
    const root = navigationRef.getRootState();
    if (!root || typeof root.index !== "number") return;
    const top = root.routes[root.index];
    const topName = top?.name;

    if (topName === ROOT_STACK.Splash) return;

    if (isAuthenticated && (topName === ROOT_STACK.Auth || topName === ROOT_STACK.Onboarding)) {
      navigationRef.reset({
        index: 0,
        routes: [{ name: ROOT_STACK.Main }],
      });
      return;
    }

    if (!isAuthenticated && topName === ROOT_STACK.Main) {
      navigationRef.reset({
        index: 0,
        routes: [{ name: ROOT_STACK.Onboarding }],
      });
    }
  }, [isAuthenticated]);

  return null;
}
