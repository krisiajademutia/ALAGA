import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { COLORS } from '../constants/theme';
import { getCachedUserAvatar, resolveUserAvatar, cacheUserProfile } from '../services/authService';

/**
 * Avatar component.
 *
 * Priority for displayed image:
 *   1. Fresh value fetched from Firestore (via userId) — ground truth
 *   2. In-memory cache hit for this userId
 *   3. The `uri` / `avatar` / `photo` prop — used as a placeholder while
 *      fetching, but NEVER preferred over a Firestore result.
 *
 * If the user has no avatar set in Firestore, initials are shown.
 * We deliberately ignore stale prop values once Firestore responds, so
 * participantAvatars cross-contamination is impossible.
 */
export default function Avatar({ name, uri, avatar, photo, url, userId, size = 44, style }) {
  // Prop-supplied URI — used only as a placeholder, never as source of truth
  const propUri = uri || avatar || photo || url || null;

  // Initial display: prefer cache (id-keyed only), else prop
  const cached = getCachedUserAvatar(userId);
  const [resolvedUri, setResolvedUri] = useState(cached || (userId ? null : propUri));
  const [hasError, setHasError] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    setHasError(false);

    if (!userId) {
      // No userId — propUri is all we have
      setResolvedUri(propUri || null);
      return;
    }

    // Check cache first (synchronous, instant)
    const hit = getCachedUserAvatar(userId);
    if (hit) {
      setResolvedUri(hit);
      return;
    }

    // Show prop as placeholder while we fetch (avoids blank flash)
    // but ONLY if we don't already have a resolved value
    if (!resolvedUri && propUri) {
      setResolvedUri(propUri);
    }

    // Fetch from Firestore — this is the authoritative source
    resolveUserAvatar(userId, null).then((found) => {
      if (!isMounted.current) return;
      if (found) {
        // Cache the correct value for this specific userId
        cacheUserProfile({ id: userId, name, avatar: found });
        setResolvedUri(found);
      } else {
        // User has no avatar set — show initials, not prop placeholder
        setResolvedUri(null);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

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
        onError={() => { setHasError(true); setResolvedUri(null); }}
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
