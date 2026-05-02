import Svg, { Circle } from "react-native-svg";

type Props = {
  size?: number;
};

/**
 * Figma「SpinnerGap」式矢量：环形短点段（置于品牌实心圆底上，白色）。
 */
export function TimelineUpcomingGlyph({ size = 20 }: Props) {
  const vb = 24;
  const cx = 12;
  const cy = 12;
  const ringR = 7;
  const dotR = 1.35;
  const count = 12;
  const dots = Array.from({ length: count }, (_, i) => {
    const a = (i / count) * Math.PI * 2 - Math.PI / 2;
    const x = cx + ringR * Math.cos(a);
    const y = cy + ringR * Math.sin(a);
    return <Circle key={i} cx={x} cy={y} r={dotR} fill="#FFFFFF" />;
  });

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${vb} ${vb}`} fill="none">
      {dots}
    </Svg>
  );
}
