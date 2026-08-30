import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { COLORS, SIZES } from '../../constants/theme';

const W = Dimensions.get('window').width;

export default function SplashScreen({ navigation }) {
  const scale   = useRef(new Animated.Value(0.4)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const textOp  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scale,   { toValue: 1, tension: 55, friction: 8, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
      Animated.timing(textOp, { toValue: 1, duration: 450, useNativeDriver: true }),
    ]).start(() => setTimeout(() => navigation.replace('Onboarding'), 1000));
  }, []);

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      <View style={[styles.blob, { width: W * 0.75, height: W * 0.75, borderRadius: W * 0.375, top: -W * 0.18, right: -W * 0.18, backgroundColor: COLORS.primaryLight, opacity: 0.45 }]} />
      <View style={[styles.blob, { width: W * 0.55, height: W * 0.55, borderRadius: W * 0.275, bottom: -W * 0.12, left: -W * 0.12, backgroundColor: COLORS.accent, opacity: 0.28 }]} />
      <View style={[styles.blob, { width: W * 0.35, height: W * 0.35, borderRadius: W * 0.175, bottom: W * 0.08, right: -W * 0.05, backgroundColor: COLORS.teal, opacity: 0.25 }]} />

      <Animated.View style={[styles.logoWrap, { transform: [{ scale }], opacity }]}>
        <View style={styles.logoRing}>
          <View style={styles.logoCore}>
            <View style={styles.pawPad} />
            <View style={[styles.pawToe, { top: -12, left: 3 }]} />
            <View style={[styles.pawToe, { top: -12, right: 3 }]} />
            <View style={[styles.pawToe, { top: -5, left: -13 }]} />
            <View style={[styles.pawToe, { top: -5, right: -13 }]} />
          </View>
        </View>
      </Animated.View>

      <Animated.View style={[styles.textBlock, { opacity: textOp }]}>
        <Text style={styles.name}>ALAGA</Text>
        <Text style={styles.tagline}>Alert. Respond. Alaga.</Text>
        <View style={styles.emojis}>
          {['🐶', '🐱', '🐰', '🐦'].map((e) => (
            <Text key={e} style={styles.emoji}>{e}</Text>
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blob: { position: 'absolute' },

  logoWrap:  { marginBottom: SIZES.lg24 },
  logoRing: {
    width: 108, height: 108, borderRadius: 54,
    backgroundColor: COLORS.tagBg,
    borderWidth: 2.5, borderColor: COLORS.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  logoCore: {
    width: 68, height: 68, borderRadius: 34,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  pawPad: {
    width: 24, height: 20, borderRadius: 10,
    backgroundColor: '#fff', marginTop: 6,
  },
  pawToe: {
    position: 'absolute',
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: '#fff',
  },

  textBlock: { alignItems: 'center' },
  name: {
    fontSize: SIZES.title,
    fontWeight: '900',
    color: COLORS.brown,
    letterSpacing: 10,
    marginBottom: SIZES.xs4 + 2,
  },
  tagline: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    letterSpacing: 1.5,
    fontWeight: '600',
    marginBottom: SIZES.lg24,
  },
  emojis: { flexDirection: 'row', gap: SIZES.md16 },
  emoji: { fontSize: 26 },
});
