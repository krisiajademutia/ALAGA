import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants/theme';
import { useApp } from '../../context/AppContext';

const { width: W } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    image: require('../../../assets/onboarding-1.png'),
    title: 'Welcome to Alaga!',
    sub: 'Where every life deserves alaga.',
    tagline: 'here in alaga,',
  },
  {
    id: '2',
    image: require('../../../assets/onboarding-2.png'),
    title: 'We help an animal in need',
    sub: 'Report stray, injured, or abandoned animals with a photo, condition, and GPS location – in seconds.',
  },
  {
    id: '3',
    image: require('../../../assets/onboarding-3.png'),
    title: 'Advocates respond fast',
    sub: 'Verified animal advocates receive instant alerts and can claim rescue cases they are willing to assist with.',
  },
  {
    id: '4',
    image: require('../../../assets/onboarding-4.png'),
    title: 'Find them a forever home.',
    sub: 'Rescued animals can be listed for adoption or foster care. Together, we turn individual concern into real rescue action',
    tagline: 'Every life deserves ALAGA.',
  },
];

export default function OnboardingScreen({ navigation }) {
  const { completeOnboarding } = useApp();
  const [idx, setIdx] = useState(0);
  const listRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleFinish = () => {
    if (completeOnboarding) completeOnboarding();
    navigation.replace('Login');
  };

  const next = () => {
    if (idx < SLIDES.length - 1) {
      listRef.current?.scrollToIndex({ index: idx + 1 });
    } else {
      handleFinish();
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Skip Button */}
      <TouchableOpacity
        style={styles.skipBtn}
        onPress={handleFinish}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      {/* Slides */}
      <Animated.FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(s) => s.id}
        horizontal
        pagingEnabled
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

      {/* Footer Area */}
      <View style={styles.footerContainer}>
        {/* Dot Indicators */}
        <View style={styles.dots}>
          {SLIDES.map((_, i) => {
            const w = scrollX.interpolate({
              inputRange: [(i - 1) * W, i * W, (i + 1) * W],
              outputRange: [8, 24, 8],
              extrapolate: 'clamp',
            });
            const op = scrollX.interpolate({
              inputRange: [(i - 1) * W, i * W, (i + 1) * W],
              outputRange: [0.35, 1, 0.35],
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

        {/* Action Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.btn}
            onPress={next}
            activeOpacity={0.85}
          >
            <Ionicons name="paw" size={18} color="#473018" style={{ marginRight: 8 }} />
            <Text style={styles.btnText}>
              {idx === SLIDES.length - 1 ? 'Get Started' : 'Next'}
            </Text>
          </TouchableOpacity>

          {/* Login Link */}
          <TouchableOpacity
            onPress={handleFinish}
            style={styles.loginLink}
          >
            <Text style={styles.loginText}>
              Already have an account?{' '}
              <Text style={styles.loginBold}>Log in.</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function Slide({ item }) {
  return (
    <View style={styles.slide}>
      {/* Dynamic Context-Aware Animated Illustration */}
      <AnimatedIllustration slideId={item.id} image={item.image} />

      {/* Text block */}
      <View style={styles.textContainer}>
        <Text style={styles.slideTitle}>{item.title}</Text>
        <Text style={styles.slideSub}>{item.sub}</Text>
        {item.tagline ? (
          <Text style={styles.slideTagline}>{item.tagline}</Text>
        ) : null}
      </View>
    </View>
  );
}

function AnimatedIllustration({ slideId, image }) {
  // Main floating and breathing loop
  const floatAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Context-specific animations
  const badge1Anim = useRef(new Animated.Value(0)).current;
  const badge2Anim = useRef(new Animated.Value(0)).current;
  const radarAnim  = useRef(new Animated.Value(0)).current;
  const heartFloat = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Gentle continuous floating for character/artwork
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -10,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 8,
          duration: 2200,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // 2. Soft breathing pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.04,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.98,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // 3. Floating micro badges (Opposing rhythm)
    Animated.loop(
      Animated.sequence([
        Animated.timing(badge1Anim, {
          toValue: -12,
          duration: 1600,
          useNativeDriver: true,
        }),
        Animated.timing(badge1Anim, {
          toValue: 6,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(badge2Anim, {
          toValue: 10,
          duration: 1700,
          useNativeDriver: true,
        }),
        Animated.timing(badge2Anim, {
          toValue: -8,
          duration: 1900,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // 4. Radar ripple expansion (for rescue & response slides)
    Animated.loop(
      Animated.timing(radarAnim, {
        toValue: 1,
        duration: 2400,
        useNativeDriver: true,
      })
    ).start();

    // 5. Rising love hearts (for adoption slide)
    Animated.loop(
      Animated.timing(heartFloat, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const radarScale = radarAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.7, 1.45],
  });
  const radarOpacity = radarAnim.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [0.65, 0.35, 0],
  });

  const heartY = heartFloat.interpolate({
    inputRange: [0, 1],
    outputRange: [10, -45],
  });
  const heartScale = heartFloat.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.6, 1.1, 0.8],
  });
  const heartOpacity = heartFloat.interpolate({
    inputRange: [0, 0.2, 0.8, 1],
    outputRange: [0, 1, 0.8, 0],
  });

  return (
    <View style={styles.imageWrap}>
      {/* ── Background Pulsing Color Halos ───────────────── */}
      <Animated.View
        style={[
          styles.haloCircle,
          slideId === '1' && { backgroundColor: '#B8E4E5', width: 220, height: 220 },
          slideId === '2' && { backgroundColor: '#FBEEAC', width: 210, height: 210 },
          slideId === '3' && { backgroundColor: '#B8D3C3', width: 220, height: 220 },
          slideId === '4' && { backgroundColor: '#FBEEAC', width: 230, height: 230 },
          {
            transform: [{ scale: pulseAnim }],
            opacity: 0.4,
          },
        ]}
      />

      {/* ── Radar Ring for Rescue & Advocate slides ──────── */}
      {(slideId === '2' || slideId === '3') && (
        <Animated.View
          style={[
            styles.radarRing,
            slideId === '2' ? { borderColor: '#92CDE5' } : { borderColor: '#B8D3C3' },
            {
              transform: [{ scale: radarScale }],
              opacity: radarOpacity,
            },
          ]}
        />
      )}

      {/* ── Main Floating Character Illustration ─────────── */}
      <Animated.View
        style={[
          styles.mainArtWrap,
          {
            transform: [{ translateY: floatAnim }, { scale: pulseAnim }],
          },
        ]}
      >
        <Image source={image} style={styles.image} resizeMode="contain" />
      </Animated.View>

      {/* ── Context-Specific Floating Animated Badges ─────── */}
      {/* SLIDE 1: Welcome (Paws & Love) */}
      {slideId === '1' && (
        <>
          <Animated.View
            style={[
              styles.floatingBadge,
              styles.badgeTopRight,
              { backgroundColor: '#B8E4E5', transform: [{ translateY: badge1Anim }] },
            ]}
          >
            <Ionicons name="paw" size={18} color="#2E7A99" />
          </Animated.View>
          <Animated.View
            style={[
              styles.floatingBadge,
              styles.badgeBottomLeft,
              { backgroundColor: '#FBEEAC', transform: [{ translateY: badge2Anim }] },
            ]}
          >
            <Ionicons name="heart" size={18} color="#D94F4F" />
          </Animated.View>
        </>
      )}

      {/* SLIDE 2: Report & Rescue (GPS Pin & Alert Beacon) */}
      {slideId === '2' && (
        <>
          <Animated.View
            style={[
              styles.floatingBadge,
              styles.badgeTopRight,
              { backgroundColor: '#92CDE5', transform: [{ translateY: badge1Anim }] },
            ]}
          >
            <Ionicons name="location" size={19} color="#1E586E" />
          </Animated.View>
          <Animated.View
            style={[
              styles.floatingBadge,
              styles.badgeBottomLeft,
              { backgroundColor: '#FBEEAC', transform: [{ translateY: badge2Anim }] },
            ]}
          >
            <Ionicons name="camera" size={17} color="#473018" />
          </Animated.View>
        </>
      )}

      {/* SLIDE 3: Advocate Network (Shield & Quick Response) */}
      {slideId === '3' && (
        <>
          <Animated.View
            style={[
              styles.floatingBadge,
              styles.badgeTopRight,
              { backgroundColor: '#B8D3C3', transform: [{ translateY: badge1Anim }] },
            ]}
          >
            <Ionicons name="shield-checkmark" size={19} color="#2E5A44" />
          </Animated.View>
          <Animated.View
            style={[
              styles.floatingBadge,
              styles.badgeBottomLeft,
              { backgroundColor: '#ABD7E2', transform: [{ translateY: badge2Anim }] },
            ]}
          >
            <Ionicons name="flash" size={18} color="#D97706" />
          </Animated.View>
        </>
      )}

      {/* SLIDE 4: Forever Home (Rising Hearts & Home) */}
      {slideId === '4' && (
        <>
          <Animated.View
            style={[
              styles.risingHeartWrap,
              {
                transform: [{ translateY: heartY }, { scale: heartScale }],
                opacity: heartOpacity,
              },
            ]}
          >
            <Ionicons name="heart" size={24} color="#D94F4F" />
          </Animated.View>
          <Animated.View
            style={[
              styles.floatingBadge,
              styles.badgeTopRight,
              { backgroundColor: '#FBEEAC', transform: [{ translateY: badge1Anim }] },
            ]}
          >
            <Ionicons name="home" size={18} color="#473018" />
          </Animated.View>
          <Animated.View
            style={[
              styles.floatingBadge,
              styles.badgeBottomLeft,
              { backgroundColor: '#B8E4E5', transform: [{ translateY: badge2Anim }] },
            ]}
          >
            <Ionicons name="happy" size={18} color="#2E7A99" />
          </Animated.View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  skipBtn: {
    position: 'absolute',
    top: 50,
    right: 24,
    zIndex: 10,
    padding: 6,
  },
  skipText: {
    fontSize: 15,
    color: '#473018',
    fontWeight: '700',
    fontFamily: 'PlusJakartaSans_700Bold',
  },

  slide: {
    width: W,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 40,
    paddingBottom: 170,
  },
  imageWrap: {
    width: 270,
    height: 270,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  haloCircle: {
    position: 'absolute',
    borderRadius: 150,
  },
  radarRing: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 2.5,
  },
  mainArtWrap: {
    width: 230,
    height: 230,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  image: {
    width: 230,
    height: 230,
  },
  floatingBadge: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
    shadowColor: '#473018',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeTopRight: {
    top: 15,
    right: 15,
  },
  badgeBottomLeft: {
    bottom: 25,
    left: 15,
  },
  risingHeartWrap: {
    position: 'absolute',
    top: 40,
    alignSelf: 'center',
    zIndex: 6,
  },

  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  slideTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#473018',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.4,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
  },
  slideSub: {
    fontSize: 14,
    color: '#685038',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 12,
    fontFamily: 'PlusJakartaSans_400Regular',
  },
  slideTagline: {
    fontSize: 16,
    fontStyle: 'italic',
    fontWeight: '700',
    color: '#473018',
    textAlign: 'center',
    marginTop: 8,
    fontFamily: 'PlusJakartaSans_700Bold',
  },

  footerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.background,
    paddingBottom: 28,
  },

  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#473018',
  },

  footer: {
    paddingHorizontal: 28,
    paddingTop: 4,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#92CDE5',
    borderRadius: 25,
    paddingVertical: 14,
    shadowColor: '#473018',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 3,
  },
  btnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#473018',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  loginLink: {
    alignItems: 'center',
    marginTop: 14,
    paddingVertical: 4,
  },
  loginText: {
    fontSize: 13,
    color: '#685038',
    fontFamily: 'PlusJakartaSans_400Regular',
  },
  loginBold: {
    color: '#473018',
    fontWeight: '700',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
});
