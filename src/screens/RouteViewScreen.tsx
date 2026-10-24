import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import OSMRouteMap from '../components/OSMRouteMap';
import * as Location from 'expo-location';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Button from '../components/Button';
import RouteSummary from '../components/RouteSummary';
import { useTrip } from '../context/TripContext';
import { useToast } from '../context/ToastContext';
import { CalculatedTrip, fetchOSRMRoute, Mode } from '../utils/route';
import { colors, font, radius } from '../theme';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'RouteView'>;
const MODES: Mode[] = ['Drive', 'Ride', 'Walk'];

export default function RouteViewScreen({ navigation }: Props) {
  const { pickup, dropoff } = useTrip();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<Mode>('Drive');
  const [satellite, setSatellite] = useState(false);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [tripData, setTripData] = useState<CalculatedTrip | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const locationSub = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (pickup && dropoff) {
      setLoadingRoute(true);
      fetchOSRMRoute(pickup, dropoff, mode).then((data) => {
        if (!isMounted) return;
        setTripData(data);
        setLoadingRoute(false);
      });
    }
    return () => {
      isMounted = false;
    };
  }, [pickup, dropoff, mode]);

  if (!pickup || !dropoff) return null;

  const coords = tripData?.coordinates ?? [];
  const steps = tripData?.steps ?? [];

  const { showToast } = useToast();

  const startNavigation = async (openExternal = false) => {
    if (openExternal) {
      const googleMode = mode === 'Walk' ? 'w' : mode === 'Ride' ? 'b' : 'd';
      const url = Platform.select({
        ios: `maps://app?saddr=${pickup.lat},${pickup.lng}&daddr=${dropoff.lat},${dropoff.lng}&dirflg=${googleMode}`,
        android: `google.navigation:q=${dropoff.lat},${dropoff.lng}&mode=${googleMode}`,
        default: `https://www.google.com/maps/dir/?api=1&origin=${pickup.lat},${pickup.lng}&destination=${dropoff.lat},${dropoff.lng}&travelmode=${mode.toLowerCase()}`,
      });

      showToast(`Opening Google Maps for ${dropoff.title}`);
      Linking.canOpenURL(url!).then((supported) => {
        if (supported) {
          Linking.openURL(url!);
        } else {
          Linking.openURL(`https://www.google.com/maps/dir/?api=1&origin=${pickup.lat},${pickup.lng}&destination=${dropoff.lat},${dropoff.lng}`);
        }
      });
      return;
    }

    // Direct In-App Navigation with Toast
    setIsNavigating(true);
    showToast(`Navigating to ${dropoff.title}`, 'success');

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        locationSub.current = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, timeInterval: 2000, distanceInterval: 5 },
          () => {}
        );
      }
    } catch {}
  };

  const stopNavigation = () => {
    if (locationSub.current) {
      locationSub.current.remove();
      locationSub.current = null;
    }
    setIsNavigating(false);
    showToast('Navigation ended');
  };

  useEffect(() => {
    return () => {
      if (locationSub.current) {
        locationSub.current.remove();
      }
    };
  }, []);

  return (
    <View style={styles.root}>
      <OSMRouteMap
        pickup={pickup}
        dropoff={dropoff}
        routeCoords={coords}
        satellite={satellite}
      />

      {/* Top Bar or Navigation HUD */}
      {!isNavigating ? (
        <View style={[styles.topBar, { top: insets.top + 8 }]}>
          <TouchableOpacity style={styles.roundBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={20} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.roundBtn} onPress={() => setSatellite((s) => !s)}>
            <Ionicons name="layers-outline" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={[styles.navHeaderCard, { top: insets.top + 10 }]}>
          <View style={styles.navTurnIcon}>
            <Ionicons name={steps[0]?.icon || 'arrow-up'} size={28} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.navTurnTitle} numberOfLines={1}>{steps[0]?.title || 'Follow route'}</Text>
            <Text style={styles.navTurnSub}>{steps[0]?.distance || 'In 100 m'} · {steps[0]?.note || 'Continue straight'}</Text>
          </View>
          <TouchableOpacity style={styles.exitNavBtn} onPress={stopNavigation}>
            <Ionicons name="close" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {/* Bottom Sheet */}
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        {!isNavigating && (
          <View style={styles.traffic}>
            <Ionicons name="warning-outline" size={13} color="#fff" />
            <Text style={styles.trafficText}>Heavy traffic near the marina</Text>
          </View>
        )}
        <View style={styles.handle} />

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={styles.cap}>{isNavigating ? 'Navigating to destination' : 'Fastest route'}</Text>
          {loadingRoute && <ActivityIndicator size="small" color={colors.primary} />}
        </View>

        <View style={styles.timeRow}>
          <Text style={styles.time}>{tripData ? tripData.durationLabel : '-- min'}</Text>
          <Text style={styles.meta}>
            {tripData ? `${tripData.distanceKm} km · arrive ${tripData.arriveTime}` : 'Calculating route...'}
          </Text>
        </View>

        {!isNavigating && (
          <View style={styles.modes}>
            {MODES.map((m) => {
              const on = m === mode;
              return (
                <Pressable key={m} onPress={() => setMode(m)} style={[styles.mode, on && styles.modeOn]}>
                  <Text style={[styles.modeText, on && { color: colors.primary }]}>{m}</Text>
                </Pressable>
              );
            })}
          </View>
        )}

        <RouteSummary from={pickup} to={dropoff} compact />

        {!isNavigating && (
          <>
            <Text style={[styles.cap, { marginTop: 14 }]}>Turn by turn</Text>
            <ScrollView style={{ maxHeight: 130 }} showsVerticalScrollIndicator={false}>
              {steps.map((s, i) => (
                <View key={s.id} style={[styles.step, i < steps.length - 1 && styles.stepDivider]}>
                  <View style={styles.stepIcon}>
                    <Ionicons name={s.icon} size={14} color={colors.text} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.stepTitle} numberOfLines={1}>{s.title}</Text>
                    <Text style={styles.stepNote} numberOfLines={1}>{s.note}</Text>
                  </View>
                  <Text style={styles.stepDist}>{s.distance}</Text>
                </View>
              ))}
            </ScrollView>
          </>
        )}

        {isNavigating ? (
          <Button
            title="End Navigation"
            style={{ marginTop: 12, backgroundColor: '#374151' }}
            icon={<Ionicons name="stop-circle" size={18} color="#fff" />}
            onPress={stopNavigation}
          />
        ) : (
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
            <Button
              title="Start navigation"
              style={{ flex: 1.4 }}
              icon={<Ionicons name="navigate" size={18} color="#fff" />}
              onPress={() => startNavigation(false)}
            />
            <Button
              variant="outline"
              title="Maps"
              style={{ flex: 0.9 }}
              icon={<Ionicons name="map" size={16} color={colors.text} />}
              onPress={() => startNavigation(true)}
            />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  topBar: { position: 'absolute', left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between' },
  roundBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', elevation: 3, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  sheet: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.card, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, paddingHorizontal: 16, paddingTop: 10 },
  traffic: { position: 'absolute', top: -38, left: 16, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.dark, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16 },
  trafficText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  handle: { alignSelf: 'center', width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: 12 },
  cap: { fontSize: 11, color: colors.muted, fontWeight: '600' },
  timeRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  time: { fontSize: 30, fontWeight: '800', color: colors.text },
  meta: { fontSize: 11, color: colors.muted, marginBottom: 6 },
  modes: { flexDirection: 'row', gap: 8, marginVertical: 12 },
  mode: { flex: 1, height: 34, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  modeOn: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  modeText: { fontSize: font.sm, fontWeight: '600', color: colors.text },
  step: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  stepDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  stepIcon: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  stepTitle: { fontSize: font.sm, fontWeight: '600', color: colors.text },
  stepNote: { fontSize: 10, color: colors.muted, marginTop: 1 },
  stepDist: { fontSize: 11, color: colors.muted },
  navHeaderCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: '#0F5132',
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  navTurnIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTurnTitle: {
    color: '#fff',
    fontSize: font.md,
    fontWeight: '700',
  },
  navTurnSub: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: font.xs,
    marginTop: 2,
  },
  exitNavBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
