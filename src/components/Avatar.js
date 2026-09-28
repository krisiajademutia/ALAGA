import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { COLORS } from '../constants/theme';
import { getCachedUserAvatar, resolveUserAvatar, cacheUserProfile, getDefaultUserAvatar } from '../services/authService';
import { useApp } from '../context/AppContext';

/**
 * Avatar component.
 *
 * Behavior:
 *   1. If the user has a custom chosen/uploaded photo (via propUri, AppContext users, cache, or Firestore), display it.
 *   2. Reactively updates whenever any profile/avatar in AppContext changes.
 *   3. If no photo has been chosen/uploaded yet, cleanly render the user's initial letters (no random portraits).
 */
export default function Avatar({ name, uri, avatar, photo, url, userId, size = 44, style }) {
  // Prop-supplied URI — custom uploaded photo
  const rawProp = uri || avatar || photo || url || null;
  const cleanPropUri = typeof rawProp === 'string' && rawProp.trim().length > 0 ? rawProp.trim() : null;

  // Reactively access AppContext safely via useApp hook
  let currentUser = null;
  let users = [];
  try {
    const appContext = useApp();
    currentUser = appContext?.currentUser || null;
    users = appContext?.users || [];
  } catch (e) {
    currentUser = null;
    users = [];
  }

  // Synchronously compute the best candidate avatar URL
  const resolvedCandidate = useMemo(() => {
    // 1. Direct prop URI if valid
    if (cleanPropUri) return cleanPropUri;

    // 2. Current User match by ID or by name
    if (userId && currentUser && (userId === currentUser.id || userId === currentUser.uid)) {
      const uAv = currentUser.avatar || currentUser.photoURL || currentUser.avatarUrl;
      if (typeof uAv === 'string' && uAv.trim().length > 0) return uAv.trim();
    }
    if (!userId && name && currentUser?.name && name.trim().toLowerCase() === currentUser.name.trim().toLowerCase()) {
      const uAv = currentUser.avatar || currentUser.photoURL || currentUser.avatarUrl;
      if (typeof uAv === 'string' && uAv.trim().length > 0) return uAv.trim();
    }

    // 3. Match from live Firestore users list in AppContext
    if (userId && Array.isArray(users) && users.length > 0) {
      const cleanTargetId = String(userId).trim();
      const match = users.find((u) => u && (String(u.id).trim() === cleanTargetId || String(u.uid).trim() === cleanTargetId));
      if (match) {
        const uAv = match.avatar || match.photoURL || match.avatarUrl;
        if (typeof uAv === 'string' && uAv.trim().length > 0) return uAv.trim();
      }
    }

    // 4. Match from live Firestore users list by name (if not generic placeholder name)
    if (name && Array.isArray(users) && users.length > 0) {
      const trimmed = name.trim().toLowerCase();
      const genericNames = ['user', 'community member', 'advocate', 'animal advocate', 'anonymous', 'rescuer', 'applicant', 'member'];
      if (!genericNames.includes(trimmed)) {
        const matchByName = users.find((u) => u && u.name && u.name.trim().toLowerCase() === trimmed);
        if (matchByName) {
          const uAv = matchByName.avatar || matchByName.photoURL || matchByName.avatarUrl;
          if (typeof uAv === 'string' && uAv.trim().length > 0) return uAv.trim();
        }
      }
    }

    // 5. In-memory profile & avatar cache
    if (userId) {
      const cached = getCachedUserAvatar(userId);
      if (cached) return cached;
    }

    return null;
  }, [cleanPropUri, userId, name, currentUser, users]);

  const [resolvedUri, setResolvedUri] = useState(resolvedCandidate);
  const [hasError, setHasError] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  // Update whenever candidate changes or props change
  useEffect(() => {
    setHasError(false);
    if (resolvedCandidate) {
      setResolvedUri(resolvedCandidate);
      if (userId) {
        cacheUserProfile({ id: userId, name, avatar: resolvedCandidate });
      }
      return;
    }

    // Asynchronous resolution from Firestore if not yet found and userId is provided
    if (userId) {
      resolveUserAvatar(userId, name).then((found) => {
        if (!isMounted.current) return;
        if (found) {
          setResolvedUri(found);
          cacheUserProfile({ id: userId, name, avatar: found });
        } else {
          setResolvedUri(null);
        }
      });
    } else {
      setResolvedUri(null);
    }
  }, [resolvedCandidate, userId, name]);

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
