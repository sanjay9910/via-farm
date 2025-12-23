import React from "react";
import Svg, { Path } from "react-native-svg";

export default function HeartIcon({
  size = 22,
  fill = "#fff",
  stroke = "#9E9E9E",
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12 21s-6.7-4.4-9.3-7.1C.7 11.9 1 7.9 4 6.2c2.2-1.3 4.7-.7 6 1.1 1.3-1.8 3.8-2.4 6-1.1 3 1.7 3.3 5.7 1.3 7.7C18.7 16.6 12 21 12 21z"
        fill={fill}
        stroke={stroke}
        strokeWidth={2}
      />
    </Svg>
  );
}
