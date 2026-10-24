import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Button from '../components/Button';
import RouteSummary from '../components/RouteSummary';
import { useTrip } from '../context/TripContext';
import { colors, font, radius } from '../theme';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'TripReady'>;

export default function TripReadyScreen({ navigation }: Props) {
  const { pickup, dropoff } = useTrip();
  if (!pickup || !dropoff) return null;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>Your trip is ready</Text>
          <Text style={styles.step}>Step 2 of 2 · Review and continue</Text>
        </View>
      </View>

      <View style={{ flex: 1, padding: 16 }}>
        <View style={styles.card}>
          <RouteSummary from={pickup} to={dropoff} />
        </View>

        <View style={styles.actions}>
          <Button
            variant="outline"
            title="Edit pickup"
            onPress={() => navigation.navigate('MapPicker', { field: 'pickup' })}
            style={{ flex: 1 }}
            icon={<Ionicons name="location-outline" size={16} color={colors.text} />}
          />
          <Button
            variant="outline"
            title="Edit drop-off"
            onPress={() => navigation.navigate('MapPicker', { field: 'dropoff' })}
            style={{ flex: 1 }}
            icon={<Ionicons name="map-outline" size={16} color={colors.text} />}
          />
        </View>
      </View>

      <View style={styles.footer}>
        <Button title="Next" onPress={() => navigation.navigate('RouteView')} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { fontSize: font.xl, fontWeight: '800', color: colors.text },
  step: { fontSize: font.sm, color: colors.muted, marginTop: 2 },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 14, borderWidth: 1, borderColor: colors.border },
  actions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  footer: { padding: 16, backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border },
});
