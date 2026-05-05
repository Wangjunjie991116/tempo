import Svg, { Path } from "react-native-svg";

type Props = {
  size?: number;
  color: string;
};

export function FinanceIcon({ size = 24, color }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        fill={color}
        d="M4 6a3 3 0 0 1 3-3h11a2 2 0 0 1 2 2v2h1a2 2 0 0 1 2 2v9a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V6Zm3-1a1 1 0 0 0-1 1v2h13V6a1 1 0 0 0-1-1H7Zm11 7h3v7a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-1h10a2 2 0 0 0 2-2v-4Zm1 2h-2v2h2v-2Z"
      />
    </Svg>
  );
}
