import React, { useEffect } from "react";
import { View, Text, StyleSheet, Pressable, Animated } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useInAppNotificationStore } from "../stores/inAppNotificationStore";
import { useAppPalette } from "../theme/useAppPalette";

export function InAppNotificationBanner() {
  const C = useAppPalette();
  const insets = useSafeAreaInsets();
  const current = useInAppNotificationStore((s) => s.queue[0]);
  const shift = useInAppNotificationStore((s) => s.shift);
  const opacity = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!current) return;
    opacity.setValue(0);
    Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }).start();
    const t = setTimeout(() => shift(), 6500);
    return () => clearTimeout(t);
  }, [current?.id, opacity, shift]);

  if (!current) return null;

  return (
    <Animated.View
      style={[
        styles.wrap,
        {
          paddingTop: insets.top + 8,
          opacity,
          backgroundColor: "transparent",
        },
      ]}
      pointerEvents="box-none"
    >
      <Pressable
        onPress={shift}
        style={[styles.card, { backgroundColor: C.surface, borderColor: C.primary, shadowColor: C.primary }]}
      >
        <Text style={[styles.title, { color: C.text }]} numberOfLines={1}>
          {current.title || "Bildirishnoma"}
        </Text>
        <Text style={[styles.body, { color: C.textSecondary }]} numberOfLines={3}>
          {current.body}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    zIndex: 9999,
    alignItems: "center",
    paddingHorizontal: 12,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingVertical: 12,
    paddingHorizontal: 14,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  title: { fontSize: 15, fontWeight: "800" },
  body: { fontSize: 13, marginTop: 4, lineHeight: 18 },
});
