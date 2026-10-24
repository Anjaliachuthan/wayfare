import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Region } from 'react-native-maps';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Button from '../components/Button';
import { useTrip } from '../context/TripContext';
import { reverseGeocodeOSM } from '../utils/geocoding';
import { colors, font, radius } from '../theme';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'MapPicker'>;

export default function MapPickerScreen({ navigation, route }: Props) {
  const { field } = route.params;
  const { pickup, dropoff, setPickup, setDropoff } = useTrip();
  const insets = useSafeAreaInsets();

  const initialCoord =
    (field === 'pickup' ? pickup : dropoff) ??
    pickup ?? {
      lat: 10.553,
      lng: 76.185,
    };

  const [region, setRegion] = useState<Region>({
    latitude: initialCoord.lat,
    longitude: initialCoord.lng,
    latitudeDelta: 0.03,
    longitudeDelta: 0.03,
  });

  const [address, setAddress] = useState<string>('Move the pin to select a location');
  const [subAddress, setSubAddress] = useState<string>('');
  const [loadingAddress, setLoadingAddress] = useState(false);

  const onRegionChangeComplete = async (newRegion: Region) => {
    setRegion(newRegion);
    setLoadingAddress(true);
    const resolved = await reverseGeocodeOSM(newRegion.latitude, newRegion.longitude);
    setAddress(resolved.title);
    setSubAddress(resolved.subtitle);
    setLoadingAddress(false);
  };

  const onConfirm = () => {
    const selectedPlace = {
      id: `picked-${Date.now()}`,
      title: address && address !== 'Move the pin to select a location' ? address : 'Selected location',
      subtitle: subAddress || `${region.latitude.toFixed(4)}, ${region.longitude.toFixed(4)}`,
      icon: 'location-outline' as const,
      lat: region.latitude,
      lng: region.longitude,
    };

    if (field === 'pickup') {
      setPickup(selectedPlace);
    } else {
      setDropoff(selectedPlace);
    }
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <MapView
        style={StyleSheet.absoluteFill}
        initialRegion={region}
        onRegionChangeComplete={onRegionChangeComplete}
      />

      {/* Center Pin Overlay */}
      <View style={styles.centerMarkerWrap} pointerEvents="none">
        <Ionicons name="location" size={42} color={colors.primary} style={{ marginTop: -42 }} />
        <View style={styles.pinShadow} />
      </View>

      {/* Top Header */}
      <View style={[styles.topBar, { top: insets.top + 8 }]}>
        <TouchableOpacity style={styles.roundBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleCard}>
          <Text style={styles.headerTitle}>
            Pick {field === 'pickup' ? 'Pickup' : 'Drop-off'}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Bottom Sheet Card */}
      <View style={[styles.bottomSheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.handle} />
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <Text style={styles.fieldLabel}>Selected location</Text>
          {loadingAddress && <ActivityIndicator size="small" color={colors.primary} />}
        </View>

        <Text style={styles.placeTitle} numberOfLines={1}>{address}</Text>
        <Text style={styles.placeSub} numberOfLines={2}>{subAddress}</Text>

        <Button
          title={`Confirm ${field === 'pickup' ? 'pickup' : 'drop-off'}`}
          onPress={onConfirm}
          style={{ marginTop: 16 }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  topBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  roundBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  headerTitleCard: {
    backgroundColor: colors.card,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.md,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  headerTitle: {
    fontSize: font.md,
    fontWeight: '700',
    color: colors.text,
  },
  centerMarkerWrap: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinShadow: {
    width: 10,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.3)',
    marginTop: 2,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: 20,
    paddingTop: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  handle: {
    alignSelf: 'center',
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: font.xs,
    color: colors.muted,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  placeTitle: {
    fontSize: font.lg,
    fontWeight: '700',
    color: colors.text,
  },
  placeSub: {
    fontSize: font.sm,
    color: colors.muted,
    marginTop: 3,
    lineHeight: 18,
  },
});
