import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Dimensions, TouchableOpacity, Animated,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants/theme';
import Button from '../../components/Button';

const { width: W } = Dimensions.get('window');

const SLIDES = [
  { id: '1', emoji: '📍', icon: 'alert-circle', color: COLORS.danger,       bg: '#FFF0EE', title: 'Spot an animal\nin need?',          sub: 'Report stray, injured, or abandoned animals with a photo, condition, and GPS location — in seconds.' },
  { id: '2', emoji: '🛡️', icon: 'shield-checkmark', color: COLORS.secondaryDark, bg: '#EEF8F3', title: 'Advocates\nrespond fast',    sub: 'Verified Animal Advocates receive instant alerts and can claim rescue cases they are willing to assist with.' },
  { id: '3', emoji: '🏠', icon: 'heart', color: COLORS.primaryDeep,          bg: '#EDF6FB', title: 'Find them a\nforever home',        sub: 'Rescued animals can be listed for adoption or foster care. Apply directly through the app.' },
  { id: '4', emoji: '🌍', icon: 'people', color: '#6D3FC2',                   bg: '#F3EEFF', title: 'One community,\none mission',     sub: 'Together, we turn individual concern into real rescue action. Every life deserves ALAGA.' },
];

export default function OnboardingScreen({ navigation }) {
  const [idx, setIdx] = useState(0);
  const listRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const next = () => {
    if (idx < SLIDES.length - 1) {
      listRef.current?.scrollToIndex({ index: idx + 1 });
    } else {
      navigation.replace('Login');
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      <TouchableOpacity
        style={styles.skipBtn}
        onPress={() => navigation.replace('Login')}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <Animated.FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(s) => s.id}
        horizontal pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onMomentumScrollEnd={(e) =>
          setIdx(Math.round(e.nativeEvent.contentOffset.x / W))
        }
        renderItem={({ item }) => <Slide item={item} />}
      />

      {/* Dot indicators */}
      <View style={styles.dots}>
        {SLIDES.map((_, i) => {
          const w = scrollX.interpolate({
            inputRange: [(i - 1) * W, i * W, (i + 1) * W],
            outputRange: [8, 22, 8],
            extrapolate: 'clamp',
          });
          const op = scrollX.interpolate({
            inputRange: [(i - 1) * W, i * W, (i + 1) * W],
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });
          return (
            <Animated.View
              key={i}
              style={[styles.dot, { width: w, opacity: op }]}
            />
          );
        })}
      </View>

      {/* CTA */}
      <View style={styles.footer}>
        <Button
          title={idx === SLIDES.length - 1 ? 'Get Started' : 'Next'}
          onPress={next}
          fullWidth
          style={styles.btn}
          icon={
            <Ionicons
              name={idx === SLIDES.length - 1 ? 'paw' : 'arrow-forward'}
              size={17}
              color="#fff"
            />
          }
        />
        {idx === SLIDES.length - 1 ? (
          <TouchableOpacity
            onPress={() => navigation.replace('Login')}
            style={styles.loginLink}
          >
            <Text style={styles.loginText}>
              Already have an account?{' '}
              <Text style={styles.loginBold}>Log in</Text>
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

function Slide({ item }) {
  return (
    <View style={[styles.slide, { backgroundColor: item.bg, width: W }]}>
      <View style={[styles.iconCircle, { borderColor: item.color + '30' }]}>
        <View style={[styles.iconInner, { backgroundColor: item.color + '18' }]}>
          <Text style={styles.slideEmoji}>{item.emoji}</Text>
        </View>
      </View>
      <Text style={styles.slideTitle}>{item.title}</Text>
      <Text style={styles.slideSub}>{item.sub}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },

  skipBtn: { position: 'absolute', top: 52, right: SIZES.lg24, zIndex: 10 },
  skipText: { fontSize: SIZES.body, color: COLORS.textSecondary, fontWeight: '600' },

  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SIZES.xl32,
    paddingTop: SIZES.xl40,
    paddingBottom: SIZES.lg24,
  },
  iconCircle: {
    width: 160, height: 160, borderRadius: 80,
    borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: SIZES.xl32,
  },
  iconInner: {
    width: 130, height: 130, borderRadius: 65,
    alignItems: 'center', justifyContent: 'center',
  },
  slideEmoji: { fontSize: 64 },
  slideTitle: {
    fontSize: SIZES.xxl,
    fontWeight: '800',
    color: COLORS.brown,
    textAlign: 'center',
    lineHeight: 34,
    marginBottom: SIZES.md16,
  },
  slideSub: {
    fontSize: SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },

  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SIZES.xs4 + 2,
    paddingVertical: SIZES.sm8,
  },
  dot: {
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.primaryDeep,
  },

  footer: {
    paddingHorizontal: SIZES.lg24,
    paddingBottom: SIZES.xl40,
    paddingTop: SIZES.sm8,
  },
  btn:       { borderRadius: SIZES.r999 },
  loginLink: { alignItems: 'center', marginTop: SIZES.md16 },
  loginText: { fontSize: SIZES.body, color: COLORS.textSecondary },
  loginBold: { color: COLORS.primaryDeep, fontWeight: '700' },
});
