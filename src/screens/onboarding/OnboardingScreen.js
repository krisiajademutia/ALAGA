import React, { useRef, useState } from 'react';
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

      {/* Skip Button */}
      <TouchableOpacity
        style={styles.skipBtn}
        onPress={() => navigation.replace('Login')}
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
            onPress={() => navigation.replace('Login')}
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
      {/* Illustration */}
      <View style={styles.imageWrap}>
        <Image source={item.image} style={styles.image} resizeMode="contain" />
      </View>

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

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
    fontWeight: '600',
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
    width: 220,
    height: 220,
    marginBottom: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: 220,
    height: 220,
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
  },
  slideSub: {
    fontSize: 14,
    color: '#5C4E3A',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 12,
  },
  slideTagline: {
    fontSize: 16,
    fontStyle: 'italic',
    fontWeight: '700',
    color: '#473018',
    textAlign: 'center',
    marginTop: 8,
  },

  footerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingBottom: 24,
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
    backgroundColor: '#B8D3C3',
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
  },
  loginLink: {
    alignItems: 'center',
    marginTop: 14,
    paddingVertical: 4,
  },
  loginText: {
    fontSize: 13,
    color: '#5C4E3A',
  },
  loginBold: {
    color: '#473018',
    fontWeight: '700',
  },
});
