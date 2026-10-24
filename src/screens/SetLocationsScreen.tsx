import React, { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Button from '../components/Button';
import PlaceRow from '../components/PlaceRow';
import { PLACES, Place } from '../data/mock';
import { useTrip } from '../context/TripContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { reverseGeocodeOSM, searchOpenStreetMap } from '../utils/geocoding';
import { colors, font, radius } from '../theme';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Field = 'pickup' | 'dropoff';
type Props = NativeStackScreenProps<RootStackParamList, 'SetLocations'>;

const customPlace = (text: string): Place => ({
  id: `custom-${text.toLowerCase()}`,
  title: text,
  subtitle: 'Custom address',
  icon: 'location-outline',
  lat: 25.3548 + (text.length % 7) * 0.006,
  lng: 51.5 + (text.length % 5) * 0.011,
});

export default function SetLocationsScreen({ navigation }: Props) {
  const { pickup, dropoff, setPickup, setDropoff, swap, reset } = useTrip();
  const { logout } = useAuth();
  const { showToast } = useToast();
  const [active, setActive] = useState<Field>('pickup');
  const [texts, setTexts] = useState({ pickup: pickup?.title ?? '', dropoff: dropoff?.title ?? '' });
  const [locating, setLocating] = useState(false);
  const [searching, setSearching] = useState(false);
  const [osmResults, setOsmResults] = useState<Place[]>([]);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep text inputs in sync when user selects a place from MapPicker
  React.useEffect(() => {
    setTexts({
      pickup: pickup?.title ?? '',
      dropoff: dropoff?.title ?? '',
    });
  }, [pickup, dropoff]);

  const inputs = {
    pickup: useRef<React.ComponentRef<typeof TextInput>>(null),
    dropoff: useRef<React.ComponentRef<typeof TextInput>>(null),
  };

  const place = { pickup, dropoff };
  const setPlace = { pickup: setPickup, dropoff: setDropoff };

  const choose = (field: Field, p: Place) => {
    setPlace[field](p);
    setTexts((t) => ({ ...t, [field]: p.title }));
    setOsmResults([]);
    // Jump to the next empty field so the user flows pickup → drop-off.
    if (field === 'pickup' && !dropoff) {
      setActive('dropoff');
      setTimeout(() => inputs.dropoff.current?.focus(), 50);
    }
  };

  const onType = (field: Field, text: string) => {
    setTexts((t) => ({ ...t, [field]: text }));
    if (!text.trim()) {
      setPlace[field](null);
      setOsmResults([]);
      return;
    }

    // Debounce OpenStreetMap live search
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      const results = await searchOpenStreetMap(text);
      setSearching(false);
      setOsmResults(results);
      if (results.length > 0 && !place[field]) {
        setPlace[field](results[0]);
      } else if (!place[field]) {
        setPlace[field](customPlace(text.trim()));
      }
    }, 350);
  };

  const clear = (field: Field) => {
    setTexts((t) => ({ ...t, [field]: '' }));
    setPlace[field](null);
    setOsmResults([]);
    setActive(field);
    inputs[field].current?.focus();
  };

  const onSwap = () => {
    swap();
    setTexts((t) => ({ pickup: t.dropoff, dropoff: t.pickup }));
  };

  const useCurrent = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showToast('Location permission needed to access current position', 'warning');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({});
      let title = 'Current Location';
      let subtitle = `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`;
      try {
        const resolved = await reverseGeocodeOSM(pos.coords.latitude, pos.coords.longitude);
        title = resolved.title;
        subtitle = resolved.subtitle;
      } catch {}
      choose(active, { id: 'current', title, subtitle, icon: 'locate-outline', lat: pos.coords.latitude, lng: pos.coords.longitude });
      showToast('Current location selected', 'success');
    } catch {
      showToast('Could not fetch current GPS location', 'error');
    } finally {
      setLocating(false);
    }
  };

  const pickOnMap = () => navigation.navigate('MapPicker', { field: active });

  const query = texts[active].trim().toLowerCase();
  const selectedTitle = place[active]?.title.toLowerCase();

  const suggestions = useMemo(() => {
    if (!query || query === selectedTitle) return PLACES;
    const localFiltered = PLACES.filter((p) => (p.title + ' ' + p.subtitle).toLowerCase().includes(query));
    if (osmResults.length > 0) {
      return [...osmResults, ...localFiltered];
    }
    return localFiltered;
  }, [query, selectedTitle, osmResults]);

  const canProceed = !!pickup && !!dropoff && pickup.title.toLowerCase() !== dropoff.title.toLowerCase();

  const renderField = (field: Field) => {
    const isActive = active === field;
    const isPickup = field === 'pickup';
    return (
      <View style={styles.fieldRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.cap, !isPickup && isActive && { color: colors.primary }, isPickup && { color: colors.primary }]}>
            {isPickup ? 'Pickup' : 'Drop-off'}
          </Text>
          <TextInput
            ref={inputs[field]}
            value={texts[field]}
            onChangeText={(t) => onType(field, t)}
            onFocus={() => setActive(field)}
            placeholder={isPickup ? 'Choose a starting point' : 'Choose a destination'}
            placeholderTextColor="#A5AAB3"
            style={styles.fieldInput}
          />
        </View>
        {!!texts[field] && (
          <TouchableOpacity onPress={() => clear(field)} hitSlop={10} style={styles.clear}>
            <Ionicons name="close" size={12} color={colors.muted} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            reset();
            logout();
            showToast('Logged out');
          }}
          hitSlop={10}
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>Where are you going?</Text>
          <Text style={styles.step}>Step 1 of 2 · Set pickup and drop-off</Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <View style={styles.rail}>
            <View style={styles.dot} />
            <View style={styles.dashed} />
            <View style={styles.square} />
          </View>
          <View style={{ flex: 1 }}>
            {renderField('pickup')}
            <View style={styles.sep} />
            {renderField('dropoff')}
          </View>
          <TouchableOpacity style={styles.swap} onPress={onSwap} hitSlop={8}>
            <Ionicons name="swap-vertical" size={16} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.actions}>
          <Button
            variant="outline"
            title="Use current"
            onPress={useCurrent}
            style={{ flex: 1 }}
            loading={locating}
            icon={<Ionicons name="locate-outline" size={16} color={colors.text} />}
          />
          <Button
            variant="outline"
            title="Pick on map"
            onPress={pickOnMap}
            style={{ flex: 1 }}
            icon={<Ionicons name="map-outline" size={16} color={colors.text} />}
          />
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, marginBottom: 8 }}>
          <Text style={[styles.section, { marginTop: 0, marginBottom: 0 }]}>
            {active === 'pickup' ? 'Set as pickup' : 'Set as drop-off'}
          </Text>
          {searching && <ActivityIndicator size="small" color={colors.primary} />}
        </View>
        {suggestions.length > 0 ? (
          <View style={styles.list}>
            {suggestions.map((p, i) => (
              <PlaceRow key={p.id} place={p} last={i === suggestions.length - 1} onPress={(pl) => choose(active, pl)} />
            ))}
          </View>
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No saved places match that. Keep typing to use it as a custom address.</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Button title="Next" disabled={!canProceed} onPress={() => navigation.navigate('TripReady')} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { fontSize: font.xl, fontWeight: '800', color: colors.text },
  step: { fontSize: font.sm, color: colors.muted, marginTop: 2 },
  card: { flexDirection: 'row', backgroundColor: colors.card, borderRadius: radius.lg, padding: 14, gap: 12, borderWidth: 1, borderColor: colors.border },
  rail: { alignItems: 'center', paddingTop: 22, paddingBottom: 22 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  dashed: { flex: 1, width: 1, borderLeftWidth: 1, borderStyle: 'dashed', borderColor: '#C9CDD3', marginVertical: 4 },
  square: { width: 8, height: 8, backgroundColor: colors.dark },
  fieldRow: { flexDirection: 'row', alignItems: 'center', minHeight: 52 },
  cap: { fontSize: 10, color: colors.muted, fontWeight: '600' },
  fieldInput: { fontSize: font.md, color: colors.text, paddingVertical: 2, fontWeight: '500' },
  sep: { height: 1, backgroundColor: colors.border },
  clear: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', marginRight: 36 },
  swap: { position: 'absolute', right: 14, top: '50%', marginTop: -16, width: 32, height: 32, borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  section: { fontSize: font.sm, color: colors.muted, fontWeight: '600', marginTop: 20, marginBottom: 8 },
  list: { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  empty: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 20, borderWidth: 1, borderColor: colors.border },
  emptyText: { textAlign: 'center', color: colors.muted, fontSize: font.sm, lineHeight: 18 },
  footer: { padding: 16, backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border },
});
