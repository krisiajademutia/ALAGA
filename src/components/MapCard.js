import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, SafeAreaView, StatusBar as RNStatusBar, Platform } from 'react-native';
import MapView, { Marker, UrlTile, PROVIDER_DEFAULT } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';

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

  const region = {
    latitude:        location.latitude,
    longitude:       location.longitude,
    latitudeDelta:   0.008,
    longitudeDelta:  0.008,
  };

  const fullRegion = {
    ...region,
    latitudeDelta:  0.04,
    longitudeDelta: 0.04,
  };

  // Web fallback using OpenStreetMap iframe embed (since react-native-maps renders a black box on Web)
  if (Platform.OS === 'web') {
    const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${location.longitude - 0.008}%2C${location.latitude - 0.008}%2C${location.longitude + 0.008}%2C${location.latitude + 0.008}&layer=mapnik&marker=${location.latitude}%2C${location.longitude}`;
    const fullMapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${location.longitude - 0.03}%2C${location.latitude - 0.03}%2C${location.longitude + 0.03}%2C${location.latitude + 0.03}&layer=mapnik&marker=${location.latitude}%2C${location.longitude}`;

    return (
      <>
        {/* ── Web Thumbnail ──────────────────────────────────── */}
        <TouchableOpacity
          style={[styles.thumb, style]}
          onPress={() => setFullscreen(true)}
          activeOpacity={0.92}
        >
          <View style={styles.webMapWrap}>
            <iframe
              title={title || location.address}
              width="100%"
              height="160"
              frameBorder="0"
              scrolling="no"
              marginHeight="0"
              marginWidth="0"
              src={mapUrl}
              style={{ border: 0, width: '100%', height: 160, pointerEvents: 'none' }}
            />
          </View>

          {/* Address overlay */}
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

        {/* ── Web Fullscreen modal ───────────────────────────── */}
        <Modal
          visible={fullscreen}
          animationType="slide"
          onRequestClose={() => setFullscreen(false)}
        >
          <View style={styles.fullContainer}>
            <SafeAreaView style={styles.fullHeader}>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setFullscreen(false)}
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
            </SafeAreaView>

            <View style={{ flex: 1, backgroundColor: '#e4ebf0' }}>
              <iframe
                title={title || location.address}
                width="100%"
                height="100%"
                frameBorder="0"
                scrolling="no"
                marginHeight="0"
                marginWidth="0"
                src={fullMapUrl}
                style={{ border: 0, width: '100%', height: '100%' }}
              />
            </View>

            <View style={styles.fullFooter}>
              <View style={styles.fullFooterIcon}>
                <Ionicons name="location" size={20} color={COLORS.primaryDeep} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fullFooterTitle}>{title || 'Rescue Location'}</Text>
                <Text style={styles.fullFooterAddr}>{location.address}</Text>
                {location.latitude && (
                  <Text style={styles.fullFooterCoords}>
                    {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
                  </Text>
                )}
              </View>
            </View>
          </View>
        </Modal>
      </>
    );
  }

  // Native (iOS / Android) MapView
  return (
    <>
      {/* ── Thumbnail ──────────────────────────────────────── */}
      <TouchableOpacity
        style={[styles.thumb, style]}
        onPress={() => setFullscreen(true)}
        activeOpacity={0.92}
      >
        <MapView
          style={styles.thumbMap}
          provider={PROVIDER_DEFAULT}
          region={region}
          scrollEnabled={false}
          zoomEnabled={false}
          rotateEnabled={false}
          pitchEnabled={false}
          pointerEvents="none"
        >
          <UrlTile
            urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            maximumZ={19}
            flipY={false}
          />
          <Marker
            coordinate={{ latitude: location.latitude, longitude: location.longitude }}
            title={title || location.address}
          />
        </MapView>

        {/* Address overlay */}
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

      {/* ── Fullscreen modal ──────────────────────────────── */}
      <Modal
        visible={fullscreen}
        animationType="slide"
        onRequestClose={() => setFullscreen(false)}
      >
        <View style={styles.fullContainer}>
          {/* Header bar */}
          <SafeAreaView style={styles.fullHeader}>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setFullscreen(false)}
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
          </SafeAreaView>

          {/* Full-screen interactive map */}
          <MapView
            style={styles.fullMap}
            provider={PROVIDER_DEFAULT}
            initialRegion={fullRegion}
            showsUserLocation
            showsMyLocationButton
            showsCompass
            showsScale
            zoomEnabled
            scrollEnabled
            rotateEnabled
            pitchEnabled
          >
            <UrlTile
              urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
              maximumZ={19}
              flipY={false}
            />
            <Marker
              coordinate={{ latitude: location.latitude, longitude: location.longitude }}
              title={title || 'Animal Location'}
              description={location.address}
              pinColor={COLORS.danger}
            />
          </MapView>

          {/* Bottom info card */}
          <View style={styles.fullFooter}>
            <View style={styles.fullFooterIcon}>
              <Ionicons name="location" size={20} color={COLORS.primaryDeep} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.fullFooterTitle}>{title || 'Rescue Location'}</Text>
              <Text style={styles.fullFooterAddr}>{location.address}</Text>
              {location.latitude && (
                <Text style={styles.fullFooterCoords}>
                  {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
                </Text>
              )}
            </View>
          </View>
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
    ...SHADOWS.card,
  },
  thumbMap: {
    width: '100%',
    height: 160,
    backgroundColor: '#e4ebf0',
  },
  webMapWrap: {
    width: '100%',
    height: 160,
    backgroundColor: '#e4ebf0',
    overflow: 'hidden',
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
    backgroundColor: COLORS.background,
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight || 0 : 0,
  },
  fullHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: SIZES.paddingL,
    paddingVertical: SIZES.paddingM,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    ...SHADOWS.card,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullHeaderText: { flex: 1 },
  fullTitle: { fontSize: SIZES.body, fontWeight: '800', color: COLORS.brown },
  fullAddr:  { fontSize: SIZES.small, color: COLORS.textSecondary, marginTop: 2 },

  fullMap: {
    flex: 1,
    backgroundColor: '#e4ebf0',
  },

  fullFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.surface,
    paddingHorizontal: SIZES.paddingL,
    paddingVertical: SIZES.paddingM,
    paddingBottom: Platform.OS === 'ios' ? 28 : SIZES.paddingM,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    ...SHADOWS.card,
  },
  fullFooterIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.tagBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullFooterTitle: { fontSize: SIZES.body, fontWeight: '800', color: COLORS.brown },
  fullFooterAddr:  { fontSize: SIZES.small, color: COLORS.textSecondary, marginTop: 2 },
  fullFooterCoords:{ fontSize: SIZES.xsmall, color: COLORS.textMuted, marginTop: 2, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
});
