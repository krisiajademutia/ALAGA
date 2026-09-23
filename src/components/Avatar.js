import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { COLORS } from '../constants/theme';
import { getCachedUserAvatar, resolveUserAvatar, cacheUserProfile, getDefaultUserAvatar } from '../services/authService';

/**
 * Avatar component.
 *
 * Priority for displayed image:
 *   1. Fresh value fetched from Firestore (via userId) — ground truth
 *   2. In-memory cache hit for this userId
 *   3. The `uri` / `avatar` / `photo` prop (uploaded custom photo)
 *   4. High-resolution deterministic portrait avatar (never blanks out to initials)
 *   5. Initials only as a last-resort offline fallback.
 */
export default function Avatar({ name, uri, avatar, photo, url, userId, size = 44, style }) {
  // Prop-supplied URI — custom uploaded photo
  const propUri = uri || avatar || photo || url || null;
  const defaultFallback = getDefaultUserAvatar(name, userId);

  // Initial display: prefer cache, else prop, else default portrait
  const cached = getCachedUserAvatar(userId);
  const [resolvedUri, setResolvedUri] = useState(cached || propUri || defaultFallback);
  const [hasError, setHasError] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  // Re-run when either userId, propUri, or name changes
  useEffect(() => {
    setHasError(false);
    const fallback = getDefaultUserAvatar(name, userId);

    if (!userId) {
      setResolvedUri(propUri || fallback);
      return;
    }

    // If propUri is a valid custom URL, use it immediately
    if (propUri) {
      setResolvedUri(propUri);
      cacheUserProfile({ id: userId, name, avatar: propUri });
    }

    // Check cache first (synchronous, instant)
    const hit = getCachedUserAvatar(userId);
    if (hit) {
      setResolvedUri(hit);
      return;
    }

    // Fetch from Firestore or resolve to fallback portrait
    resolveUserAvatar(userId, name).then((found) => {
      if (!isMounted.current) return;
      const target = found || propUri || fallback;
      setResolvedUri(target);
      if (target) {
        cacheUserProfile({ id: userId, name, avatar: target });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, propUri, name]);

  const initials = name
    ? name.split(' ').filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  const r = size / 2;
  const base = { width: size, height: size, borderRadius: r };
  const showImage = !hasError && resolvedUri && typeof resolvedUri === 'string' && resolvedUri.trim().length > 0;

  const handleImageError = () => {
    const fallback = getDefaultUserAvatar(name, userId);
    if (resolvedUri !== fallback) {
      setResolvedUri(fallback);
      setHasError(false);
    } else {
      setHasError(true);
      setResolvedUri(null);
    }
  };

  if (showImage) {
    return (
      <Image
        source={{ uri: resolvedUri }}
        style={[styles.img, base, style]}
        onError={handleImageError}
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
