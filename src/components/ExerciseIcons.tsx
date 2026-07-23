import React from 'react';
import Svg, { Path } from 'react-native-svg';

/**
 * Fitbit-style Flame Icon (Active Calories Burned)
 */
export function FitbitFlameIcon({
  size = 14,
  color = '#FF2D55',
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M12 2C11.5 6 8.5 8 8.5 12C8.5 14.5 10 16.5 12 17C10.5 15.5 10.5 13.5 12 12C13.5 10.5 14.5 9 14.5 7C16.5 9.5 17.5 12.5 17 15.5C16.5 18.5 14 21 11 21.5C7 22 3.5 19 3 15C2.5 11 4.5 7.5 7.5 5.5C7 7.5 8 9 9 9.5C9.5 7 11 3.5 12 2Z" />
    </Svg>
  );
}

/**
 * Fitbit-style Athletic Shoe / Footprint Icon (Steps Count)
 */
export function FitbitShoeIcon({
  size = 14,
  color = '#A3E635',
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M2.5 15.5L4 12.5C4.5 11.5 5.5 11 6.5 11H10.5L13.5 6C14.2 4.8 15.5 4 17 4C19.2 4 21 5.8 21 8V14C21 16.2 19.2 18 17 18H5C3.6 18 2.5 16.9 2.5 15.5Z" />
      <Path d="M2.5 15.5H21" />
      <Path d="M6 18V20" />
      <Path d="M11 18V20" />
      <Path d="M16 18V20" />
    </Svg>
  );
}

/**
 * Fitbit-style Active Zone Minutes Heart-Pulse Icon (Active Minutes)
 */
export function FitbitActiveMinutesIcon({
  size = 14,
  color = '#00D5E8',
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      <Path d="M7.5 12h2.5l1.5-3 2 6 1.5-3h2.5" />
    </Svg>
  );
}
