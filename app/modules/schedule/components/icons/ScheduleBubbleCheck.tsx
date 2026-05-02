import Svg, { Path } from "react-native-svg";

type Props = {
  size?: number;
  color?: string;
};

/** 完成态时间轴圆徽标内的纯白勾选（无底板圆形）。 */
export function ScheduleBubbleCheck({ size = 18, color = "#FFFFFF" }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path fill={color} d="M9 16.17 5.53 12.7a1 1 0 1 0-1.41 1.41l5 5a1 1 0 0 0 1.41 0l11.83-11.83a1 1 0 1 0-1.41-1.41L9 16.17Z" />
    </Svg>
  );
}
