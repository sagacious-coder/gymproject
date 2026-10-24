import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  borderColor?: string;
  intensity?: 'subtle' | 'medium' | 'high';
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  borderColor = 'rgba(255, 255, 255, 0.08)',
  intensity = 'medium',
}) => {
  const bgOpacity = intensity === 'subtle' ? 0.03 : intensity === 'high' ? 0.12 : 0.06;

  return (
    <View style={[styles.container, { borderColor }, style]}>
      <LinearGradient
        colors={[
          `rgba(255, 255, 255, ${bgOpacity + 0.04})`,
          `rgba(255, 255, 255, ${bgOpacity})`,
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    backgroundColor: 'rgba(18, 18, 24, 0.65)',
  },
});
