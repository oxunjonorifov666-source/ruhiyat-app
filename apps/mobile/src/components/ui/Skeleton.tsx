import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';
import { Colors } from '../../constants/colors';

export function Skeleton({ style }: { style?: ViewStyle }) {
  const opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.85, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.35, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return <Animated.View style={[styles.base, style, { opacity }]} />;
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: Colors.border,
    borderRadius: 12,
  },
});
