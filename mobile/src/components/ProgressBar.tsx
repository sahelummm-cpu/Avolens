import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, View } from 'react-native';

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
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: Math.max(0, Math.min(1, fraction)) * trackW,
      duration: 500,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      useNativeDriver: false,
    }).start();
  }, [fraction, trackW, anim]);

  return (
    <View
      onLayout={(e) => setTrackW(e.nativeEvent.layout.width)}
      style={{ height, borderRadius: 99, backgroundColor: trackColor, overflow: 'hidden' }}
    >
      <Animated.View style={{ height, borderRadius: 99, backgroundColor: color, width: anim }} />
    </View>
  );
}
