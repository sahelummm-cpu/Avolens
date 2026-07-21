import { useRef, useState } from 'react';
import { View, Text, PanResponder, type LayoutChangeEvent } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useStore } from '@/lib/store';
import { F } from '@/lib/fonts';
import { tap } from '../haptics';

export function Slider({
  min,
  max,
  step,
  value,
  onChange,
  format,
  labelRenderer,
}: {
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
  labelRenderer?: (v: number) => React.ReactNode;
}) {
  const { theme: t } = useStore();
  const [trackWidth, setTrackWidth] = useState(0);
  const isDragging = useRef(false);

  const steps = Math.round((max - min) / step);

  const getPositionForValue = (val: number, width: number) => {
    if (width === 0) return 0;
    const clamped = Math.max(min, Math.min(max, val));
    return ((clamped - min) / (max - min)) * width;
  };

  const getValueForPosition = (pos: number, width: number) => {
    if (width === 0) return min;
    const clampedPos = Math.max(0, Math.min(width, pos));
    const rawVal = min + (clampedPos / width) * (max - min);
    // snap to step
    const snapped = Math.round(rawVal / step) * step;
    return Math.max(min, Math.min(max, snapped));
  };

  const thumbX = useSharedValue(getPositionForValue(value, trackWidth));
  const activeScale = useSharedValue(1);

  // Sync reanimated value if props change or layout completes
  if (!isDragging.current && trackWidth > 0) {
    thumbX.value = withSpring(getPositionForValue(value, trackWidth), { damping: 20, stiffness: 300 });
  }

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt, gestureState) => {
        isDragging.current = true;
        activeScale.value = withSpring(1.2, { damping: 15, stiffness: 300 });
        
        // Jump to tap position
        if (trackWidth > 0) {
          const newPos = evt.nativeEvent.locationX;
          const newVal = getValueForPosition(newPos, trackWidth);
          thumbX.value = getPositionForValue(newVal, trackWidth);
          if (newVal !== value) {
            tap();
            onChange(newVal);
          }
        }
      },
      onPanResponderMove: (evt, gestureState) => {
        if (trackWidth > 0) {
          // calculate pos from initial touch + accumulated distance
          const newPos = evt.nativeEvent.locationX; // using locationX for relative positioning within track
          const newVal = getValueForPosition(newPos, trackWidth);
          thumbX.value = getPositionForValue(newVal, trackWidth);
          
          if (newVal !== value) {
            tap();
            onChange(newVal);
          }
        }
      },
      onPanResponderRelease: () => {
        isDragging.current = false;
        activeScale.value = withSpring(1, { damping: 15, stiffness: 300 });
        // Snap to exact step position
        if (trackWidth > 0) {
          thumbX.value = withSpring(getPositionForValue(value, trackWidth), { damping: 20, stiffness: 300 });
        }
      },
      onPanResponderTerminate: () => {
        isDragging.current = false;
        activeScale.value = withSpring(1, { damping: 15, stiffness: 300 });
        if (trackWidth > 0) {
          thumbX.value = withSpring(getPositionForValue(value, trackWidth), { damping: 20, stiffness: 300 });
        }
      },
    })
  ).current;

  const handleLayout = (e: LayoutChangeEvent) => {
    setTrackWidth(e.nativeEvent.layout.width);
  };

  const animatedThumbStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: thumbX.value - 14 }, // -14 to center the 28px thumb
      { scale: activeScale.value },
    ],
  }));

  const animatedFillStyle = useAnimatedStyle(() => ({
    width: thumbX.value,
  }));

  return (
    <View style={{ paddingVertical: 10 }}>
      {format && (
        <Text style={{ fontFamily: F.d800, fontSize: 28, color: t.ink, letterSpacing: -0.5, textAlign: 'center', marginBottom: 20 }}>
          {format(value)}
        </Text>
      )}

      {/* Touch Target & Track Wrapper */}
      <View
        style={{ height: 44, justifyContent: 'center' }}
        onLayout={handleLayout}
        {...panResponder.panHandlers}
      >
        {/* Background Track */}
        <View style={{ height: 6, backgroundColor: t.border, borderRadius: 3, width: '100%' }} />

        {/* Fill Track */}
        <Animated.View
          style={[{ position: 'absolute', left: 0, height: 6, backgroundColor: t.green, borderRadius: 3 }, animatedFillStyle]}
        />

        {/* Thumb */}
        <Animated.View
          style={[{
            position: 'absolute',
            left: 0,
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: '#fff',
            borderWidth: 2,
            borderColor: t.green,
            shadowColor: t.ink,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 4,
            elevation: 3,
          }, animatedThumbStyle]}
        />
      </View>

      {/* Custom label below the slider */}
      {labelRenderer && (
        <View style={{ marginTop: 16 }}>
          {labelRenderer(value)}
        </View>
      )}
    </View>
  );
}
