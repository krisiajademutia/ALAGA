import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { COLORS, SIZES } from '../../constants/theme';

const W = Dimensions.get('window').width;

export default function SplashScreen({ navigation }) {
  const scale   = useRef(new Animated.Value(0.7)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const textOp  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scale,   { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
      Animated.timing(textOp, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start(() => setTimeout(() => navigation.replace('Onboarding'), 1200));
  }, []);

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      <View style={[styles.blob, { width: W * 0.75, height: W * 0.75, borderRadius: W * 0.375, top: -W * 0.18, right: -W * 0.18, backgroundColor: COLORS.primaryLight, opacity: 0.35 }]} />
      <View style={[styles.blob, { width: W * 0.55, height: W * 0.55, borderRadius: W * 0.275, bottom: -W * 0.12, left: -W * 0.12, backgroundColor: COLORS.accent, opacity: 0.25 }]} />
      <View style={[styles.blob, { width: W * 0.35, height: W * 0.35, borderRadius: W * 0.175, bottom: W * 0.08, right: -W * 0.05, backgroundColor: COLORS.teal, opacity: 0.2 }]} />

      <Animated.View style={[styles.logoWrap, { transform: [{ scale }], opacity }]}>
        <Image
          source={require('../../../assets/alaga-logo.png')}
          style={styles.logoImg}
          resizeMode="contain"
        />
      </Animated.View>

      <Animated.View style={[styles.textBlock, { opacity: textOp }]}>
        <Text style={styles.tagline}>Alert · Respond · Alaga</Text>
        <Text style={styles.subtext}>Where every life deserves ALAGA</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  blob: { position: 'absolute' },
  logoWrap: {
    width: W * 0.78,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoImg: {
    width: '100%',
    height: '100%',
  },
  textBlock: { alignItems: 'center' },
  tagline: {
    fontSize: 14,
    color: '#8C7D6A',
    letterSpacing: 2,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  subtext: {
    fontSize: 12,
    color: '#8C9DA6',
    fontWeight: '600',
    marginTop: 6,
  },
});
