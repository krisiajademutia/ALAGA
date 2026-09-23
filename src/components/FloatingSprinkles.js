import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// Colors matching original reference screenshot palette
const COLORS_PALETTE = {
  yellow: '#F8DF72',
  mint: '#A8C3B2',
  taupe: '#8C7C6D',
  charcoal: '#706253',
};

function SingleSprinkle({ style, children, floatDistance = 12, duration = 2400, delay = 0, rotateDeg = '10deg' }) {
  const floatAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -floatDistance,
          duration: duration,
          useNativeDriver: true,
          delay: delay,
        }),
        Animated.timing(floatAnim, {
          toValue: floatDistance / 2,
          duration: duration * 1.1,
          useNativeDriver: true,
        }),
      ])
    );

    const rotateLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: duration * 1.8,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: duration * 1.8,
          useNativeDriver: true,
        }),
      ])
    );

    floatLoop.start();
    rotateLoop.start();

    return () => {
      floatLoop.stop();
      rotateLoop.stop();
    };
  }, []);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', rotateDeg],
  });

  return (
    <Animated.View
      style={[
        styles.sprinkleBase,
        style,
        {
          transform: [{ translateY: floatAnim }, { rotate: spin }],
        },
      ]}
      pointerEvents="none"
    >
      {children}
    </Animated.View>
  );
}

export default function FloatingSprinkles() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* 1. Top Left: Double Star (Yellow & Mint) */}
      <SingleSprinkle style={{ top: 48, left: 24 }} floatDistance={14} duration={2600} rotateDeg="-12deg">
        <View style={styles.doubleStarWrap}>
          <Ionicons name="star-outline" size={32} color={COLORS_PALETTE.yellow} />
          <Ionicons name="star-outline" size={26} color={COLORS_PALETTE.mint} style={styles.starOverlap} />
        </View>
      </SingleSprinkle>

      {/* 2. Top Center: Rotated Rounded Square / Diamond (Taupe) */}
      <SingleSprinkle style={{ top: 88, left: SCREEN_W * 0.5 - 12 }} floatDistance={10} duration={3100} rotateDeg="25deg">
        <View style={[styles.outlineSquare, { borderColor: COLORS_PALETTE.taupe }]} />
      </SingleSprinkle>

      {/* 3. Top Right Pill: Slanted Mint Dash */}
      <SingleSprinkle style={{ top: 52, right: 95 }} floatDistance={8} duration={2800} rotateDeg="-20deg">
        <View style={[styles.pillDash, { backgroundColor: COLORS_PALETTE.mint }]} />
      </SingleSprinkle>

      {/* 4. Top Right: Pastel Yellow Doodle Heart */}
      <SingleSprinkle style={{ top: 110, right: 30 }} floatDistance={15} duration={2300} rotateDeg="15deg">
        <Ionicons name="heart-outline" size={30} color={COLORS_PALETTE.yellow} />
      </SingleSprinkle>

      {/* 5. Upper Mid Left: Mint Triangle */}
      <SingleSprinkle style={{ top: SCREEN_H * 0.3, left: 32 }} floatDistance={12} duration={2700} rotateDeg="18deg">
        <Ionicons name="triangle-outline" size={24} color={COLORS_PALETTE.mint} />
      </SingleSprinkle>

      {/* 6. Upper Mid Left: Slanted Pill */}
      <SingleSprinkle style={{ top: SCREEN_H * 0.4, left: 8 }} floatDistance={10} duration={3300} rotateDeg="-25deg">
        <View style={[styles.pillDash, { backgroundColor: COLORS_PALETTE.mint, width: 28, height: 6 }]} />
      </SingleSprinkle>

      {/* 7. Upper Mid Right: Starburst Dots Cluster */}
      <SingleSprinkle style={{ top: SCREEN_H * 0.29, right: 22 }} floatDistance={14} duration={2500} rotateDeg="45deg">
        <Ionicons name="sunny-outline" size={22} color={COLORS_PALETTE.charcoal} />
      </SingleSprinkle>

      {/* 8. Center-Right Circle near illustration */}
      <SingleSprinkle style={{ top: SCREEN_H * 0.45, right: 75 }} floatDistance={9} duration={2900}>
        <View style={[styles.outlineCircle, { borderColor: COLORS_PALETTE.taupe }]} />
      </SingleSprinkle>

      {/* 9. Mid Right Pill */}
      <SingleSprinkle style={{ top: SCREEN_H * 0.52, right: 18 }} floatDistance={11} duration={3000} rotateDeg="-30deg">
        <View style={[styles.pillDash, { backgroundColor: COLORS_PALETTE.mint }]} />
      </SingleSprinkle>

      {/* 10. Mid Right Double Star */}
      <SingleSprinkle style={{ top: SCREEN_H * 0.58, right: 28 }} floatDistance={16} duration={2400} rotateDeg="10deg">
        <View style={styles.doubleStarWrap}>
          <Ionicons name="star-outline" size={28} color={COLORS_PALETTE.yellow} />
          <Ionicons name="star-outline" size={22} color={COLORS_PALETTE.mint} style={styles.starOverlap} />
        </View>
      </SingleSprinkle>

      {/* 11. Mid-Lower Left: Taupe Doodle Heart */}
      <SingleSprinkle style={{ top: SCREEN_H * 0.68, left: 24 }} floatDistance={14} duration={2600} rotateDeg="-15deg">
        <Ionicons name="heart-outline" size={34} color={COLORS_PALETTE.taupe} />
      </SingleSprinkle>

      {/* 12. Bottom Left: Starburst Dots */}
      <SingleSprinkle style={{ bottom: 100, left: 36 }} floatDistance={12} duration={2800} rotateDeg="30deg">
        <Ionicons name="sparkles-outline" size={22} color={COLORS_PALETTE.charcoal} />
      </SingleSprinkle>

      {/* 13. Bottom Left Circle */}
      <SingleSprinkle style={{ bottom: 50, left: 72 }} floatDistance={10} duration={3200}>
        <View style={[styles.outlineCircle, { borderColor: COLORS_PALETTE.taupe, width: 22, height: 22, borderRadius: 11 }]} />
      </SingleSprinkle>

      {/* 14. Bottom Center Pill */}
      <SingleSprinkle style={{ bottom: 180, right: 100 }} floatDistance={9} duration={2900} rotateDeg="-20deg">
        <View style={[styles.pillDash, { backgroundColor: COLORS_PALETTE.mint, width: 24, height: 6 }]} />
      </SingleSprinkle>

      {/* 15. Bottom Right: Double Star */}
      <SingleSprinkle style={{ bottom: 45, right: 40 }} floatDistance={15} duration={2500} rotateDeg="15deg">
        <View style={styles.doubleStarWrap}>
          <Ionicons name="star-outline" size={30} color={COLORS_PALETTE.yellow} />
          <Ionicons name="star-outline" size={24} color={COLORS_PALETTE.mint} style={styles.starOverlap} />
        </View>
      </SingleSprinkle>
    </View>
  );
}

const styles = StyleSheet.create({
  sprinkleBase: {
    position: 'absolute',
    zIndex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doubleStarWrap: {
    position: 'relative',
    width: 36,
    height: 36,
  },
  starOverlap: {
    position: 'absolute',
    bottom: -4,
    right: -4,
  },
  outlineSquare: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
  },
  outlineCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
  },
  pillDash: {
    width: 26,
    height: 6,
    borderRadius: 3,
  },
});
