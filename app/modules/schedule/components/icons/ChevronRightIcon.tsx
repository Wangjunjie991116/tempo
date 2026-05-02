import Svg, { Path } from "react-native-svg";

type Props = {
  size?: number;
  color: string;
};

export function ChevronRightIcon({ size = 24, color }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        fill={color}
        d="M9.29 15.88 13.17 12 9.29 8.12a.996.996 0 1 1 1.41-1.41l4.59 4.59c.39.39.39 1.02 0 1.41l-4.59 4.59a.996.996 0 0 1-1.41-1.41Z"
      />
    </Svg>
  );
}
