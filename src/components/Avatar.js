import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { COLORS } from '../constants/theme';
import { getCachedUserAvatar, resolveUserAvatar, cacheUserProfile } from '../services/authService';

export default function Avatar({ name, uri, avatar, photo, url, userId, size = 44, style }) {
  const directUri = uri || avatar || photo || url || null;
  const initialUri = directUri || getCachedUserAvatar(userId, name);
  const [resolvedUri, setResolvedUri] = useState(initialUri);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (directUri && typeof directUri === 'string' && directUri.trim().length > 0) {
      setResolvedUri(directUri);
      setHasError(false);
      if (userId || name) {
        cacheUserProfile({ id: userId, name, avatar: directUri });
      }
      return;
    }

    const cached = getCachedUserAvatar(userId, name);
    if (cached) {
      setResolvedUri(cached);
      setHasError(false);
      return;
    }

    let isMounted = true;
    if (userId || name) {
      resolveUserAvatar(userId, name).then((foundUri) => {
        if (isMounted && foundUri) {
          setResolvedUri(foundUri);
          setHasError(false);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [directUri, userId, name]);

  const initials = name
    ? name.split(' ').filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  const r = size / 2;
  const base = { width: size, height: size, borderRadius: r };
  const showImage = !hasError && resolvedUri && typeof resolvedUri === 'string' && resolvedUri.trim().length > 0;

  if (showImage) {
    return (
      <Image
        source={{ uri: resolvedUri }}
        style={[styles.img, base, style]}
        onError={() => setHasError(true)}
      />
    );
  }

  return (
    <View style={[styles.placeholder, base, style]}>
      <Text style={[styles.initials, { fontSize: size * 0.36 }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  img: {
    resizeMode: 'cover',
    backgroundColor: '#E8DEC5',
  },
  placeholder: {
    backgroundColor: COLORS.tagBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: COLORS.primaryDeep,
    fontWeight: '800',
  },
});
