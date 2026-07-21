import Svg, { Circle, Path, Rect } from 'react-native-svg';

export interface IconProps {
  color: string;
  size?: number;
}

/**
 * Calorie Icon (Fire Flame)
 */
export function CalorieIcon({ color = '#FF3B30', size = 14 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M12 2c1 4 4 5 4 9a4 4 0 0 1-8 0c0-2 1-3 1-3-1 5 3 5 3 2 0-3-1-5 0-8Z" />
    </Svg>
  );
}

/**
 * Protein Icon (Filled Solid Chicken Leg Silhouette)
 */
export function ProteinIcon({ color, size = 14 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="m15.4 3.6 5 5a4.5 4.5 0 0 1-1.4 7.2l-2.1 1.1a4.2 4.2 0 0 1-4.3-.6L9 12.8a4.2 4.2 0 0 1-.6-4.3l1.1-2.1a4.5 4.5 0 0 1 5.9-2.8z" />
      <Path d="M6.5 17.5 3.7 20.3a1.5 1.5 0 1 1-2.1-2.1l2.8-2.8" stroke={color} strokeWidth={2.8} strokeLinecap="round" />
    </Svg>
  );
}

/**
 * Carbs Icon (Wheat/Grain stalk)
 */
export function CarbsIcon({ color, size = 14 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 2v20" />
      <Path d="M12 6c-2-1.5-4-1.5-5 0 1.5 2 3.5 2 5 0Z" />
      <Path d="M12 6c2-1.5 4-1.5 5 0-1.5 2-3.5 2-5 0Z" />
      <Path d="M12 12c-2-1.5-4-1.5-5 0 1.5 2 3.5 2 5 0Z" />
      <Path d="M12 12c2-1.5 4-1.5 5 0-1.5 2-3.5 2-5 0Z" />
      <Path d="M12 18c-2-1.5-4-1.5-5 0 1.5 2 3.5 2 5 0Z" />
      <Path d="M12 18c2-1.5 4-1.5 5 0-1.5 2-3.5 2-5 0Z" />
    </Svg>
  );
}

/**
 * Fat Icon (Olive / Oil drop)
 */
export function FatIcon({ color, size = 14 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 2.5C12 2.5 6 10 6 15a6 6 0 0 0 12 0c0-5-6-12.5-6-12.5Z" />
      <Path d="M10 13a2 2 0 0 0 2 2" />
    </Svg>
  );
}

/**
 * Water Icon (Water droplet)
 */
export function WaterIcon({ color, size = 14 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 2.5C12 2.5 5.5 10.5 5.5 15.5a6.5 6.5 0 1 0 13 0C18.5 10.5 12 2.5 12 2.5Z" />
    </Svg>
  );
}

/**
 * Fiber Icon (Leaf / Sprout)
 */
export function FiberIcon({ color, size = 14 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M11 20A9 9 0 0 0 20 11V3h-8a9 9 0 0 0-9 9 9 9 0 0 0 8 8Z" />
      <Path d="M3 21 13 11" />
    </Svg>
  );
}

/**
 * Sodium Icon (Salt Shaker / Crystal)
 */
export function SodiumIcon({ color, size = 14 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M9 3h6v3H9z" />
      <Path d="M7 6h10l1.5 14a1 1 0 0 1-1 1H6.5a1 1 0 0 1-1-1L7 6Z" />
      <Circle cx={12} cy={12} r={1} fill={color} />
      <Circle cx={9.5} cy={15} r={1} fill={color} />
      <Circle cx={14.5} cy={15} r={1} fill={color} />
    </Svg>
  );
}

/**
 * Sugar Icon (Sugar Cube / Sweet)
 */
export function SugarIcon({ color, size = 14 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <Rect x={4} y={8} width={16} height={12} rx={2} />
      <Path d="M8 8V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v3" />
      <Path d="M12 12v4" />
      <Path d="M10 14h4" />
    </Svg>
  );
}
