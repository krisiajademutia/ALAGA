import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  StatusBar as RNStatusBar,
  Platform,
  Linking,
  ActivityIndicator,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';

let WebViewComponent = null;
if (Platform.OS !== 'web') {
  try {
    WebViewComponent = require('react-native-webview').WebView;
  } catch (e) {
    console.warn('[MapCard] react-native-webview could not be loaded:', e);
  }
}

/**
 * Builds responsive, high-performance HTML with Leaflet and CartoDB Voyager tiles.
 * Works without Google Maps API keys and never produces a black screen.
 */
function buildMapHtml({ latitude, longitude, title, address, interactive = true }) {
  const safeTitle = JSON.stringify(title || 'Rescue Location');
  const safeAddress = JSON.stringify(address || '');
  const lat = Number(latitude) || 0;
  const lng = Number(longitude) || 0;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=${interactive ? 'yes' : 'no'}" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: 100%;
      height: 100%;
      background: #eaf1f4;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    #map {
      width: 100%;
      height: 100%;
      background: #eaf1f4;
    }
    .custom-pin-wrap {
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }
    .pin-pulse {
      position: absolute;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: rgba(232, 98, 42, 0.32);
      animation: pinPulse 2s infinite ease-out;
    }
    .pin-marker {
      width: 32px;
      height: 32px;
      border-radius: 50% 50% 50% 0;
      background: #E8622A;
      position: absolute;
      transform: rotate(-45deg);
      border: 3px solid #FFFFFF;
      box-shadow: 0 4px 12px rgba(0,0,0,0.35);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .pin-dot {
      width: 10px;
      height: 10px;
      background: #FFFFFF;
      border-radius: 50%;
    }
    @keyframes pinPulse {
      0% { transform: scale(0.6); opacity: 1; }
      100% { transform: scale(1.6); opacity: 0; }
    }
    .recenter-btn {
      position: absolute;
      top: 14px;
      right: 14px;
      z-index: 1000;
      background: #FFFFFF;
      border: 1px solid #E8DFC8;
      width: 42px;
      height: 42px;
      border-radius: 21px;
      box-shadow: 0 3px 12px rgba(71,48,24,0.16);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 19px;
      outline: none;
      -webkit-tap-highlight-color: transparent;
    }
    .recenter-btn:active {
      transform: scale(0.94);
      background: #FAF6E9;
    }
    .leaflet-control-zoom {
      border: none !important;
      box-shadow: 0 3px 12px rgba(71,48,24,0.16) !important;
      border-radius: 10px !important;
      overflow: hidden;
      margin-left: 14px !important;
      margin-top: 14px !important;
    }
    .leaflet-control-zoom a {
      color: #473018 !important;
      background-color: #FFFFFF !important;
      border-bottom: 1px solid #E8DFC8 !important;
      width: 36px !important;
      height: 36px !important;
      line-height: 36px !important;
      font-size: 18px !important;
    }
    .leaflet-popup-content-wrapper {
      border-radius: 14px;
      box-shadow: 0 6px 18px rgba(71,48,24,0.18);
      border: 1px solid #E8DFC8;
    }
    .leaflet-popup-tip {
      background: #FFFFFF;
    }
    .popup-box {
      font-family: system-ui, -apple-system, sans-serif;
      padding: 3px 2px;
    }
    .popup-title {
      font-weight: 700;
      color: #473018;
      font-size: 13px;
      line-height: 1.3;
    }
    .popup-addr {
      color: #685038;
      font-size: 11px;
      margin-top: 4px;
      line-height: 1.3;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  ${interactive ? '<button class="recenter-btn" id="recenterBtn" title="Center on pin">🎯</button>' : ''}
  <script>
    var map = L.map('map', {
      zoomControl: ${interactive},
      dragging: ${interactive},
      touchZoom: ${interactive},
      scrollWheelZoom: ${interactive},
      doubleClickZoom: ${interactive},
      boxZoom: ${interactive},
      keyboard: ${interactive},
      attributionControl: false
    }).setView([${lat}, ${lng}], 15);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);

    var pinHtml = '<div class="custom-pin-wrap"><div class="pin-pulse"></div><div class="pin-marker"><div class="pin-dot"></div></div></div>';
    var customIcon = L.divIcon({
      className: 'alaga-pin',
      html: pinHtml,
      iconSize: [32, 44],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32]
    });

    var marker = L.marker([${lat}, ${lng}], { icon: customIcon }).addTo(map);
    var title = ${safeTitle};
    var address = ${safeAddress};

    ${interactive ? `
    var popupContent = '<div class="popup-box"><div class="popup-title">' + title + '</div>' + (address ? '<div class="popup-addr">' + address + '</div>' : '') + '</div>';
    marker.bindPopup(popupContent).openPopup();

    var recenter = document.getElementById('recenterBtn');
    if (recenter) {
      recenter.addEventListener('click', function(e) {
        e.preventDefault();
        map.setView([${lat}, ${lng}], 15, { animate: true });
        marker.openPopup();
      });
    }
    ` : ''}
  </script>
</body>
</html>`;
}

/**
 * MapCard
 * Props:
 *   location  — { latitude, longitude, address }
 *   title     — optional pin title (defaults to address)
 *   style     — outer container style override
 */
export default function MapCard({ location, title, style }) {
  const [fullscreen, setFullscreen] = useState(false);

  if (!location?.latitude || !location?.longitude) {
    return (
      <View style={[styles.noMap, style]}>
        <Ionicons name="location-outline" size={22} color={COLORS.textMuted} />
        <Text style={styles.noMapText}>Location not available</Text>
      </View>
    );
  }

  const thumbHtml = buildMapHtml({
    latitude: location.latitude,
    longitude: location.longitude,
    title,
    address: location.address,
    interactive: false,
  });

  const fullHtml = buildMapHtml({
    latitude: location.latitude,
    longitude: location.longitude,
    title,
    address: location.address,
    interactive: true,
  });

  const handleOpenNavigation = () => {
    const lat = location.latitude;
    const lng = location.longitude;
    const label = encodeURIComponent(title || 'Animal Rescue Location');
    const nativeUrl = Platform.select({
      ios: `maps:0,0?q=${label}@${lat},${lng}`,
      android: `geo:0,0?q=${lat},${lng}(${label})`,
      default: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
    });
    const webFallback = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

    Linking.canOpenURL(nativeUrl)
      .then((supported) => {
        if (supported) {
          Linking.openURL(nativeUrl);
        } else {
          Linking.openURL(webFallback);
        }
      })
      .catch(() => Linking.openURL(webFallback));
  };

  const handleShareLocation = async () => {
    try {
      const lat = location.latitude;
      const lng = location.longitude;
      const mapLink = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
      await Share.share({
        title: title || 'Animal Rescue Location',
        message: `${title ? title + ' - ' : ''}${location.address || 'Rescue Location'}\nMap: ${mapLink}`,
      });
    } catch (e) {
      // dismissed
    }
  };

  const renderThumbnailMap = () => {
    if (Platform.OS === 'web') {
      return (
        <iframe
          title={title || location.address}
          width="100%"
          height="160"
          frameBorder="0"
          scrolling="no"
          srcDoc={thumbHtml}
          style={{ border: 0, width: '100%', height: 160, pointerEvents: 'none' }}
        />
      );
    }

    if (WebViewComponent) {
      return (
        <WebViewComponent
          originWhitelist={['*']}
          source={{ html: thumbHtml }}
          style={styles.thumbMap}
          scrollEnabled={false}
          pointerEvents="none"
        />
      );
    }

    return (
      <View style={styles.fallbackThumb}>
        <Ionicons name="map" size={32} color={COLORS.primaryDeep} />
        <Text style={styles.fallbackText}>Tap to view map</Text>
      </View>
    );
  };

  const renderFullscreenMap = () => {
    if (Platform.OS === 'web') {
      return (
        <iframe
          title={title || location.address}
          width="100%"
          height="100%"
          frameBorder="0"
          srcDoc={fullHtml}
          style={{ border: 0, width: '100%', height: '100%' }}
        />
      );
    }

    if (WebViewComponent) {
      return (
        <WebViewComponent
          originWhitelist={['*']}
          source={{ html: fullHtml }}
          style={styles.fullMap}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.mapLoadingOverlay}>
              <ActivityIndicator size="large" color={COLORS.primaryDeep} />
              <Text style={styles.mapLoadingText}>Loading map view...</Text>
            </View>
          )}
        />
      );
    }

    return (
      <View style={styles.fallbackFull}>
        <Ionicons name="map-outline" size={48} color={COLORS.primaryDeep} />
        <Text style={styles.fallbackFullTitle}>{title || 'Rescue Location'}</Text>
        <Text style={styles.fallbackFullSub}>{location.address}</Text>
        <TouchableOpacity style={styles.directionsBtn} onPress={handleOpenNavigation}>
          <Ionicons name="navigate" size={18} color="#FFFFFF" />
          <Text style={styles.directionsBtnText}>Open in Navigation App</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <>
      {/* ── Card Thumbnail ──────────────────────────────────── */}
      <TouchableOpacity
        style={[styles.thumb, style]}
        onPress={() => setFullscreen(true)}
        activeOpacity={0.92}
      >
        <View style={styles.mapWrap}>
          {renderThumbnailMap()}
          {/* Overlay to ensure taps reliably trigger onPress */}
          <View style={StyleSheet.absoluteFillObject} pointerEvents="auto" />
        </View>

        {/* Address & Expand Bar */}
        <View style={styles.addressBar}>
          <Ionicons name="location" size={14} color={COLORS.primaryDeep} />
          <Text style={styles.addressText} numberOfLines={1}>
            {location.address || 'See location'}
          </Text>
          <View style={styles.expandBtn}>
            <Ionicons name="expand-outline" size={14} color={COLORS.primaryDeep} />
            <Text style={styles.expandText}>Full Map</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* ── Fullscreen Interactive Map Modal ─────────────────── */}
      <Modal
        visible={fullscreen}
        animationType="slide"
        onRequestClose={() => setFullscreen(false)}
      >
        <View style={styles.fullContainer}>
          {/* Header Bar */}
          <SafeAreaView style={styles.fullHeader}>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setFullscreen(false)}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-back" size={22} color={COLORS.brown} />
            </TouchableOpacity>

            <View style={styles.fullHeaderText}>
              <Text style={styles.fullTitle} numberOfLines={1}>
                {title || 'Rescue Location'}
              </Text>
              <Text style={styles.fullAddr} numberOfLines={1}>
                {location.address}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.shareBtn}
              onPress={handleShareLocation}
              activeOpacity={0.8}
            >
              <Ionicons name="share-outline" size={20} color={COLORS.brown} />
            </TouchableOpacity>
          </SafeAreaView>

          {/* Interactive Map View */}
          <View style={{ flex: 1, backgroundColor: '#eaf1f4' }}>
            {renderFullscreenMap()}
          </View>

          {/* Bottom Card with Details & Directions Action */}
          <SafeAreaView style={styles.fullFooter}>
            <View style={styles.fullFooterRow}>
              <View style={styles.fullFooterIcon}>
                <Ionicons name="location" size={20} color={COLORS.primaryDeep} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fullFooterTitle} numberOfLines={1}>
                  {title || 'Rescue Location'}
                </Text>
                <Text style={styles.fullFooterAddr} numberOfLines={2}>
                  {location.address}
                </Text>
                {location.latitude && (
                  <Text style={styles.fullFooterCoords}>
                    {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
                  </Text>
                )}
              </View>
            </View>

            {/* Prominent Open in Maps / Navigation Action Button */}
            <TouchableOpacity
              style={styles.directionsBtn}
              onPress={handleOpenNavigation}
              activeOpacity={0.88}
            >
              <Ionicons name="navigate" size={18} color="#FFFFFF" />
              <Text style={styles.directionsBtnText}>Get Directions / Open in Maps</Text>
            </TouchableOpacity>
          </SafeAreaView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // Thumbnail
  thumb: {
    borderRadius: SIZES.radius,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    ...SHADOWS.card,
  },
  mapWrap: {
    width: '100%',
    height: 160,
    backgroundColor: '#eaf1f4',
    overflow: 'hidden',
    position: 'relative',
  },
  thumbMap: {
    width: '100%',
    height: 160,
    backgroundColor: '#eaf1f4',
  },
  fallbackThumb: {
    width: '100%',
    height: 160,
    backgroundColor: '#EBF3F6',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  fallbackText: {
    fontSize: SIZES.small,
    color: COLORS.primaryDeep,
    fontWeight: '700',
  },
  addressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.surface,
    paddingHorizontal: SIZES.paddingM,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  addressText: {
    flex: 1,
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  expandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.tagBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: SIZES.radiusFull,
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
  },
  expandText: {
    fontSize: SIZES.xsmall,
    fontWeight: '700',
    color: COLORS.primaryDeep,
  },

  noMap: {
    height: 80,
    backgroundColor: COLORS.inputBg,
    borderRadius: SIZES.radius,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  noMapText: {
    fontSize: SIZES.small,
    color: COLORS.textMuted,
    fontWeight: '600',
  },

  // Fullscreen
  fullContainer: {
    flex: 1,
    backgroundColor: '#FCF8E8',
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight || 0 : 0,
  },
  fullHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FCF8E8',
    borderBottomWidth: 1,
    borderBottomColor: '#E8DFC8',
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E8DFC8',
    ...SHADOWS.sm,
  },
  shareBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E8DFC8',
    ...SHADOWS.sm,
  },
  fullHeaderText: {
    flex: 1,
  },
  fullTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#473018',
  },
  fullAddr: {
    fontSize: 12,
    color: '#685038',
    marginTop: 2,
  },

  fullMap: {
    flex: 1,
    backgroundColor: '#eaf1f4',
  },
  mapLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#eaf1f4',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    zIndex: 10,
  },
  mapLoadingText: {
    fontSize: 13,
    color: COLORS.primaryDeep,
    fontWeight: '600',
  },

  fallbackFull: {
    flex: 1,
    backgroundColor: '#FCF8E8',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  fallbackFullTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.brown,
    textAlign: 'center',
  },
  fallbackFullSub: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },

  fullFooter: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: Platform.OS === 'ios' ? 20 : 16,
    borderTopWidth: 1,
    borderTopColor: '#E8DFC8',
    ...SHADOWS.card,
    gap: 14,
  },
  fullFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fullFooterIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EBF7FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullFooterTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#473018',
  },
  fullFooterAddr: {
    fontSize: 12,
    color: '#685038',
    marginTop: 2,
    lineHeight: 16,
  },
  fullFooterCoords: {
    fontSize: 11,
    color: '#2E7A99',
    marginTop: 3,
    fontWeight: '700',
  },

  directionsBtn: {
    backgroundColor: '#2E7A99',
    borderRadius: 14,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...SHADOWS.md,
  },
  directionsBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
