import React, { useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withSpring,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface GlowingMicButtonProps {
  isListening: boolean;
  onPress: () => void;
  size?: number;
}

export const GlowingMicButton: React.FC<GlowingMicButtonProps> = ({
  isListening,
  onPress,
  size = 84,
}) => {
  // Shared animation values
  const pulse1 = useSharedValue(1);
  const pulse2 = useSharedValue(1);
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.4);

  useEffect(() => {
    if (isListening) {
      // Fast, dynamic voice wave pulsing when actively recording
      pulse1.value = withRepeat(
        withTiming(1.9, { duration: 1100, easing: Easing.out(Easing.ease) }),
        -1,
        false
      );
      pulse2.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 250 }),
          withTiming(2.3, { duration: 1300, easing: Easing.out(Easing.quad) })
        ),
        -1,
        false
      );
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.85, { duration: 600 }),
          withTiming(0.4, { duration: 600 })
        ),
        -1,
        true
      );
    } else {
      // Gentle, luxurious ambient breathing when idle
      pulse1.value = withRepeat(
        withTiming(1.25, { duration: 2400, easing: Easing.inOut(Easing.sin) }),
        -1,
        true
      );
      pulse2.value = 1;
      glowOpacity.value = withRepeat(
        withTiming(0.35, { duration: 2400, easing: Easing.inOut(Easing.sin) }),
        -1,
        true
      );
    }
  }, [isListening, pulse1, pulse2, glowOpacity]);

  const handlePressIn = () => {
    scale.value = withSpring(0.92, { damping: 15, stiffness: 200 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1.0, { damping: 12, stiffness: 180 });
  };

  // Animated styles for concentric rings
  const ring1Style = useAnimatedStyle(() => {
    const opacity = isListening
      ? interpolate(pulse1.value, [1, 1.9], [0.75, 0])
      : interpolate(pulse1.value, [1, 1.25], [0.35, 0.05]);

    return {
      transform: [{ scale: pulse1.value }],
      opacity,
    };
  });

  const ring2Style = useAnimatedStyle(() => {
    if (!isListening) return { opacity: 0, transform: [{ scale: 1 }] };
    const opacity = interpolate(pulse2.value, [1, 2.3], [0.55, 0]);
    return {
      transform: [{ scale: pulse2.value }],
      opacity,
    };
  });

  const buttonStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const glowStyle = useAnimatedStyle(() => {
    return {
      opacity: glowOpacity.value,
    };
  });

  return (
    <View style={[styles.container, { width: size * 2.6, height: size * 2.6 }]}>
      {/* Outer Pulse Wave (Ring 2) */}
      <Animated.View
        style={[
          styles.glowRing,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: isListening ? '#00F0FF' : '#6366F1',
          },
          ring2Style,
        ]}
      />

      {/* Inner Pulse Wave (Ring 1) */}
      <Animated.View
        style={[
          styles.glowRing,
          {
            width: size * 1.15,
            height: size * 1.15,
            borderRadius: (size * 1.15) / 2,
            backgroundColor: isListening ? '#10B981' : '#8B5CF6',
          },
          ring1Style,
        ]}
      />

      {/* Ambient Neon Backlight Halo */}
      <Animated.View
        style={[
          styles.ambientHalo,
          {
            width: size * 1.2,
            height: size * 1.2,
            borderRadius: (size * 1.2) / 2,
            backgroundColor: isListening ? '#00F0FF' : '#6366F1',
            shadowColor: isListening ? '#00F0FF' : '#8B5CF6',
          },
          glowStyle,
        ]}
      />

      {/* Core Button */}
      <Animated.View style={[buttonStyle]}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={[
            styles.touchable,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
            },
          ]}
        >
          <LinearGradient
            colors={
              isListening
                ? ['#00F0FF', '#059669', '#10B981']
                : ['#38BDF8', '#6366F1', '#8B5CF6']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.gradient,
              {
                borderRadius: size / 2,
              },
            ]}
          >
            <View style={styles.glassHighlight} />
            <Ionicons
              name={isListening ? 'radio' : 'mic'}
              size={size * 0.44}
              color="#FFFFFF"
            />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowRing: {
    position: 'absolute',
  },
  ambientHalo: {
    position: 'absolute',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 28,
    elevation: 20,
  },
  touchable: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 15,
    elevation: 12,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  glassHighlight: {
    position: 'absolute',
    top: 2,
    left: 8,
    right: 8,
    height: '42%',
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
});
