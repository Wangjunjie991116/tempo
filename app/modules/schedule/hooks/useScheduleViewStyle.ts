import { useState, useEffect, useCallback } from "react";

import {
  bootstrapScheduleViewStyle,
  getScheduleViewStyle,
  setScheduleViewStyle,
  subscribeScheduleViewStyle,
  type ScheduleViewStyle,
} from "../../../core/preference/scheduleViewPreference";

/**
 * 读取并管理日程视图风格偏好；设置页切换后会自动同步到当前组件。
 *
 * @example
 * ```tsx
 * const { style, setStyle, loaded } = useScheduleViewStyle();
 * if (!loaded) return null;
 * return style === "compact" ? <CompactView /> : <TimelineView />;
 * ```
 */
export function useScheduleViewStyle() {
  const [style, setStyleState] = useState<ScheduleViewStyle>(getScheduleViewStyle);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;
    bootstrapScheduleViewStyle().then((s) => {
      if (mounted) {
        setStyleState(s);
        setLoaded(true);
      }
    });

    const unsubscribe = subscribeScheduleViewStyle((next) => {
      if (mounted) {
        setStyleState(next);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const setStyle = useCallback(async (next: ScheduleViewStyle) => {
    setStyleState(next);
    await setScheduleViewStyle(next);
  }, []);

  return { style, setStyle, loaded };
}
