import { Platform } from 'react-native';

// ── Lazy Loader ──────────────────────────────────────────────────
// We must NOT cache expo-notifications at module load time because of
// circular dependency timing: during a require cycle, the module object
// is partially initialized and exports like scheduleNotificationAsync
// are still undefined. Instead, we require it fresh each time it is
// needed (Metro caches modules, so this has no performance cost).
let _warnedNError = false;
function getN() {
  try {
    return require('expo-notifications');
  } catch (e) {
    if (!_warnedNError) {
      console.warn('[notificationService] Failed to require expo-notifications:', e?.message || e);
      _warnedNError = true;
    }
    return null;
  }
}

// Track whether the notification handler has been set up
let _handlerSet = false;

function setupHandlerIfNeeded(N) {
  if (_handlerSet || !N?.setNotificationHandler || Platform.OS === 'web') return;
  try {
    N.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldShowBanner: true,   // keeps notification in pull-down shade
        shouldShowList: true,     // keeps notification in pull-down shade
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
      handleSuccess: () => {},
      handleError: (id, err) => {
        console.warn('[notificationService] handleNotification error:', id, err);
      },
    });
    _handlerSet = true;
  } catch (err) {
    console.warn('[notificationService] Error setting notification handler:', err);
  }
}

/**
 * Initialize notification channels (Android) and verify permissions
 */
export async function initNotifications() {
  if (Platform.OS === 'web') return false;

  const N = getN();
  if (!N?.getPermissionsAsync) {
    console.warn('[notificationService] expo-notifications not available on init');
    return false;
  }

  setupHandlerIfNeeded(N);

  try {
    if (N.cancelAllScheduledNotificationsAsync) {
      await N.cancelAllScheduledNotificationsAsync().catch(() => {});
    }
  } catch (e) {}

  try {
    const { status: existingStatus } = await N.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await N.requestPermissionsAsync({
        android: {},
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });
      finalStatus = status;
    }

    if (Platform.OS === 'android' && N.setNotificationChannelAsync) {
      try {
        const maxImportance = N.AndroidImportance?.MAX ?? 5;
        const highImportance = N.AndroidImportance?.HIGH ?? 4;
        const publicVisibility = N.AndroidNotificationVisibility?.PUBLIC ?? 1;

        // General channel
        await N.setNotificationChannelAsync('default', {
          name: 'General Notifications',
          importance: maxImportance,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#2E7A99',
          lockscreenVisibility: publicVisibility,
          showBadge: true,
        });

        // Emergency rescue alerts channel (High priority)
        await N.setNotificationChannelAsync('rescue-alerts', {
          name: 'Emergency Rescue Alerts',
          importance: maxImportance,
          sound: 'default',
          vibrationPattern: [0, 500, 250, 500],
          lightColor: '#E8622A',
          lockscreenVisibility: publicVisibility,
          bypassDnd: true,
          showBadge: true,
        });

        // Direct messaging channel
        await N.setNotificationChannelAsync('messages', {
          name: 'Direct Messages',
          importance: highImportance,
          sound: 'default',
          vibrationPattern: [0, 200, 200, 200],
          lightColor: '#2E7A99',
          lockscreenVisibility: publicVisibility,
          showBadge: true,
        });

        // System fallback channel
        await N.setNotificationChannelAsync('expo_notifications_fallback_notification_channel', {
          name: 'Rescue Notifications',
          importance: maxImportance,
          sound: 'default',
          vibrationPattern: [0, 500, 250, 500],
          lightColor: '#E8622A',
          lockscreenVisibility: publicVisibility,
          bypassDnd: true,
          showBadge: true,
        });
      } catch (channelErr) {
        // Expo Go does not allow managing custom notification channels natively.
        // The fallback notification channel is used automatically.
      }
    }

    return finalStatus === 'granted';
  } catch (error) {
    console.warn('[notificationService] Error initializing notifications:', error);
    return false;
  }
}

/**
 * Haversine formula to compute distance in kilometers between two GPS coordinates
 */
export function getDistanceInKm(lat1, lon1, lat2, lon2) {
  const rLat1 = Number(lat1);
  const rLon1 = Number(lon1);
  const rLat2 = Number(lat2);
  const rLon2 = Number(lon2);

  if (isNaN(rLat1) || isNaN(rLon1) || isNaN(rLat2) || isNaN(rLon2)) return null;

  const R = 6371;
  const dLat = (rLat2 - rLat1) * (Math.PI / 180);
  const dLon = (rLon2 - rLon1) * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rLat1 * (Math.PI / 180)) *
      Math.cos(rLat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Send notification to the phone's native system notification panel (pull-down shade).
 * Keeps the notification in the notification panel until the user manually dismisses it.
 */
export async function notifyPhoneSystem({ title, body, data = {}, channelId = 'rescue-alerts' }) {
  if (Platform.OS === 'web') return;

  // Fresh require every call — avoids circular dependency timing issues
  const N = getN();

  if (!N) {
    console.warn('[notificationService] expo-notifications failed to load');
    return;
  }

  // Ensure handler is set now that the module is fully loaded
  setupHandlerIfNeeded(N);

  if (!N.scheduleNotificationAsync) {
    console.warn('[notificationService] scheduleNotificationAsync not available (Expo Go restriction)');
    return;
  }

  try {
    // 1. Ensure permissions
    if (N.getPermissionsAsync) {
      const { status: currentStatus } = await N.getPermissionsAsync();
      if (currentStatus !== 'granted' && N.requestPermissionsAsync) {
        await N.requestPermissionsAsync({
          android: {},
          ios: { allowAlert: true, allowBadge: true, allowSound: true },
        });
      }
    }

    // 2. Try to register Android notification channel (succeeds in dev builds, safely ignored in Expo Go)
    if (Platform.OS === 'android' && N.setNotificationChannelAsync) {
      try {
        const maxImportance = N.AndroidImportance?.MAX ?? 5;
        const publicVis = N.AndroidNotificationVisibility?.PUBLIC ?? 1;

        await N.setNotificationChannelAsync(channelId, {
          name: channelId === 'messages' ? 'Direct Messages' : 'Emergency Rescue Alerts',
          importance: maxImportance,
          sound: 'default',
          vibrationPattern: [0, 400, 200, 400],
          lightColor: '#E8622A',
          lockscreenVisibility: publicVis,
          bypassDnd: true,
          showBadge: true,
        });

        await N.setNotificationChannelAsync('expo_notifications_fallback_notification_channel', {
          name: 'Rescue Notifications',
          importance: maxImportance,
          sound: 'default',
          vibrationPattern: [0, 400, 200, 400],
          lightColor: '#E8622A',
          lockscreenVisibility: publicVis,
          bypassDnd: true,
          showBadge: true,
        });
      } catch (channelErr) {
        // Expo Go does not support custom channel creation; fallback channel will be used automatically
      }
    }

    // 3. Schedule the notification — this sends it to the phone's system notification drawer
    const notifId = 'alaga_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
    await N.scheduleNotificationAsync({
      identifier: notifId,
      content: {
        title,
        body,
        data,
        sound: 'default',
        priority: N.AndroidNotificationPriority?.MAX ?? 'max',
        autoDismiss: false,
        sticky: false,
      },
      // Passing explicit null triggers immediately and routes to the system notification panel
      trigger: null,
    });

    console.log('[notificationService] ✅ Notification posted to system panel:', notifId, title);
  } catch (err) {
    console.warn('[notificationService] Failed to post notification to phone panel:', err);
  }
}

/**
 * Trigger high-priority phone notification when a rescue alert is within 5km
 */
export async function notifyNearbyRescueAlert({ report, distanceKm }) {
  const distStr =
    distanceKm !== null && distanceKm !== undefined
      ? ` (${distanceKm < 1 ? Math.round(distanceKm * 1000) + 'm' : distanceKm.toFixed(1) + ' km'} away)`
      : '';

  const title = `Rescue Alert: Animal Reported Nearby${distStr}`;
  const body = `${report.title || report.animalType || 'Animal'} reported at ${
    report.location?.address || 'nearby location'
  }. Tap to review details.`;

  await notifyPhoneSystem({
    title,
    body,
    data: { type: 'rescue', reportId: report.id },
    channelId: 'rescue-alerts',
  });
}

/**
 * Trigger phone notification when a new message arrives
 */
export async function notifyNewMessage({ senderName, messageText, conversationId }) {
  const title = `New message from ${senderName || 'Advocate'}`;
  const body = messageText || 'Sent you a message';

  await notifyPhoneSystem({
    title,
    body,
    data: { type: 'chat', conversationId },
    channelId: 'messages',
  });
}

/**
 * Listen for user tapping on a system notification from the notification panel
 */
export function registerNotificationResponseListener(onNotificationTap) {
  if (Platform.OS === 'web') return () => {};
  const N = getN();
  if (!N?.addNotificationResponseReceivedListener) return () => {};

  try {
    const sub = N.addNotificationResponseReceivedListener((response) => {
      const data = response?.notification?.request?.content?.data;
      if (data && onNotificationTap) {
        onNotificationTap(data);
      }
    });
    return () => {
      try {
        sub?.remove?.();
      } catch (e) {}
    };
  } catch (e) {
    return () => {};
  }
}
