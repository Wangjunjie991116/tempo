import Svg, { Path } from "react-native-svg";

type Props = {
  size?: number;
  color: string;
};

/** 卡片时段行前的小型日历图标（与设计稿一致）。 */
export function CalendarSmallIcon({ size = 16, color }: Props) {
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
