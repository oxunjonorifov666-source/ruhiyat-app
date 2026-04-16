import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Dimensions, StyleSheet, View } from "react-native";

const { width: W, height: H } = Dimensions.get("window");
const N = 28;

type Particle = {
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
  anim: Animated.Value;
};

export function ParticleBackground({ color }: { color: string }) {
  const particles = useMemo(() => {
    const out: Particle[] = [];
    for (let i = 0; i < N; i++) {
      out.push({
        x: Math.random() * W,
        y: Math.random() * H,
        size: 2 + Math.random() * 3,
        delay: Math.random() * 4000,
        duration: 6000 + Math.random() * 5000,
        anim: new Animated.Value(0),
      });
    }
    return out;
  }, []);

  useEffect(() => {
    const loops = particles.map((p) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(p.delay),
          Animated.timing(p.anim, {
            toValue: 1,
            duration: p.duration,
            useNativeDriver: true,
          }),
          Animated.timing(p.anim, {
            toValue: 0,
            duration: p.duration,
            useNativeDriver: true,
          }),
        ]),
      ),
    );
    loops.forEach((l) => l.start());
    return () => {
      loops.forEach((l) => l.stop());
    };
  }, [particles]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((p, i) => {
        const translateY = p.anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -40 - (i % 5) * 8],
        });
        const opacity = p.anim.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0.15, 0.45, 0.15],
        });
        return (
          <Animated.View
            key={i}
            style={{
              position: "absolute",
              left: p.x,
              top: p.y,
              width: p.size,
              height: p.size,
              borderRadius: p.size / 2,
              backgroundColor: color,
              opacity,
              transform: [{ translateY }],
            }}
          />
        );
      })}
    </View>
  );
}
