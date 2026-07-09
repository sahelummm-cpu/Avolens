import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

/**
 * Rounded progress bar with the web app's `width .5s cubic-bezier(.4,0,.2,1)`
 * fill transition (used by the water tracker and nutrient rows).
 */
export function ProgressBar({
  fraction,
  color,
  trackColor,
  height = 7,
}: {
  fraction: number; // 0-1
  color: string;
  trackColor: string;
  height?: number;
}) {
  const [trackW, setTrackW] = useState(0);
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withTiming(Math.max(0, Math.min(1, fraction)) * trackW, {
      duration: 500,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    });
  }, [fraction, trackW, width]);

  const fillStyle = useAnimatedStyle(() => ({ width: width.value }));

  return (
    <View
      onLayout={(e) => setTrackW(e.nativeEvent.layout.width)}
      style={{ height, borderRadius: 99, backgroundColor: trackColor, overflow: 'hidden' }}
    >
      <Animated.View style={[{ height, borderRadius: 99, backgroundColor: color }, fillStyle]} />
    </View>
  );
}
