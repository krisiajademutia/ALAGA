import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { COLORS } from '../constants/theme';
import { getCachedUserAvatar, resolveUserAvatar, cacheUserProfile, getDefaultUserAvatar } from '../services/authService';

/**
 * Avatar component.
 *
 * Behavior:
 *   1. If the user has a custom chosen/uploaded photo (via propUri, cache, or Firestore), display it.
 *   2. If no photo has been chosen/uploaded yet, cleanly render the user's initial letters (no random portraits).
 */
export default function Avatar({ name, uri, avatar, photo, url, userId, size = 44, style }) {
  // Prop-supplied URI — custom uploaded photo
  const rawProp = uri || avatar || photo || url || null;
  const cleanPropUri = typeof rawProp === 'string' && rawProp.trim().length > 0 ? rawProp.trim() : null;

  // Initial display: prefer live user avatar if userId is available, else prop URI
  const cached = userId ? getCachedUserAvatar(userId) : null;
  const [resolvedUri, setResolvedUri] = useState(cached || cleanPropUri || null);
  const [hasError, setHasError] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  // Re-run when either userId, cleanPropUri, or name changes
  useEffect(() => {
    setHasError(false);

    // 1. If userId is provided, prioritize the live profile avatar
    if (userId) {
      const hit = getCachedUserAvatar(userId);
      if (hit) {
        setResolvedUri(hit);
        return;
      }
      if (cleanPropUri) {
        setResolvedUri(cleanPropUri);
        cacheUserProfile({ id: userId, name, avatar: cleanPropUri });
        return;
      }

      // Resolve from Firestore if not in cache
      resolveUserAvatar(userId, name).then((found) => {
        if (!isMounted.current) return;
        if (found) {
          setResolvedUri(found);
          cacheUserProfile({ id: userId, name, avatar: found });
        } else {
          setResolvedUri(null);
        }
      });
      return;
    }

    // 2. No userId, rely strictly on prop URI
    if (cleanPropUri) {
      setResolvedUri(cleanPropUri);
    } else {
      setResolvedUri(null);
    }
  }, [userId, cleanPropUri, name]);

  const initials = name
    ? name.split(' ').filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  const r = size / 2;
  const base = { width: size, height: size, borderRadius: r };
  const showImage = !hasError && resolvedUri && typeof resolvedUri === 'string' && resolvedUri.trim().length > 0;

  const handleImageError = () => {
    setHasError(true);
    setResolvedUri(null);
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
      <Text style={[styles.initials, { fontSize: size * 0.38 }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  img: {
    resizeMode: 'cover',
    backgroundColor: '#E8DEC5',
  },
  placeholder: {
    backgroundColor: '#EBF4EF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D4E7DC',
  },
  initials: {
    color: '#306B4D',
    fontWeight: '800',
  },
});
