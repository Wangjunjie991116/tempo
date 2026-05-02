import Svg, { Path } from "react-native-svg";

type Props = {
  size?: number;
  color: string;
};

/** 底部 Tab — 日程（日历）。 */
export function TabScheduleIcon({ size = 24, color }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        fill={color}
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8 2a1 1 0 0 1 1 1v1h6V3a1 1 0 1 1 2 0v1h1a3 3 0 0 1 3 3v13a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h1V3a1 1 0 0 1 1-1Zm11 9H5v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9Zm-10 3a1 1 0 0 1 1-1h2a1 1 0 1 1 0 2h-2a1 1 0 0 1-1-1Z"
      />
    </Svg>
  );
}

/** 底部 Tab — 资产（钱包）。 */
export function TabFinanceIcon({ size = 24, color }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        fill={color}
        d="M4 6a3 3 0 0 1 3-3h11a2 2 0 0 1 2 2v2h1a2 2 0 0 1 2 2v9a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V6Zm3-1a1 1 0 0 0-1 1v2h13V6a1 1 0 0 0-1-1H7Zm11 7h3v7a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-1h10a2 2 0 0 0 2-2v-4Zm1 2h-2v2h2v-2Z"
      />
    </Svg>
  );
}

/** 底部 Tab — 我（人像轮廓）。 */
export function TabUserIcon({ size = 24, color }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        fill={color}
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm-2 8a6 6 0 1 1 6.47 5.98 7 7 0 0 0-8.94 0A6 6 0 0 1 10 12Zm1.35 7.95c.54.05 1.1.05 1.65 0a9 9 0 0 0 2.55-.69l-.98-1.73a7 7 0 0 1-4.14 0l-.98 1.73c.79.33 1.65.56 2.55.69h.25Z"
      />
    </Svg>
  );
}
