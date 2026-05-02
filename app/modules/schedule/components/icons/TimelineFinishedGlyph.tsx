import Svg, { Circle, Path } from "react-native-svg";

type Props = {
  size?: number;
};

/**
 * 已完成时间轴圆内图标：对照 Figma「CheckCircle」组件 — 白描边圆环 + 勾（置于品牌/成功色实心圆底上）。
 */
export function TimelineFinishedGlyph({ size = 20 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke="#FFFFFF" strokeWidth={2} />
      <Path
        d="M8 12.2 10.5 14.7 16.2 9"
        stroke="#FFFFFF"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
