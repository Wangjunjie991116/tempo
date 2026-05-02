import Svg, { Circle, Path, Rect } from "react-native-svg";

type Props = {
  size?: number;
  color: string;
};

/**
 * 卡片时段行前图标：对照 Figma「CalendarDots」— 描边日历 + 三圆点。
 */
export function CalendarDotsIcon({ size = 16, color }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Rect x="2.5" y="3.5" width="15" height="14" rx="2" stroke={color} strokeWidth={1.5} />
      <Path d="M2.5 7.5h15" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M6.5 2v3M13.5 2v3" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Circle cx="6" cy="13" r="1.25" fill={color} />
      <Circle cx="10" cy="13" r="1.25" fill={color} />
      <Circle cx="14" cy="13" r="1.25" fill={color} />
    </Svg>
  );
}
