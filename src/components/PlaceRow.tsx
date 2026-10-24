import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Place } from '../data/mock';
import { colors, font } from '../theme';

type Props = { place: Place; onPress: (p: Place) => void; last?: boolean };

export default function PlaceRow({ place, onPress, last }: Props) {
  return (
    <Pressable
      onPress={() => onPress(place)}
      style={({ pressed }) => [styles.row, !last && styles.divider, pressed && { backgroundColor: colors.bg }]}
    >
      <View style={styles.iconWrap}>
        <Ionicons name={place.icon} size={18} color={colors.text} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.title} numberOfLines={1}>{place.title}</Text>
        <Text style={styles.sub} numberOfLines={1}>{place.subtitle}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14, gap: 12 },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  iconWrap: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: font.md, fontWeight: '600', color: colors.text },
  sub: { fontSize: font.sm, color: colors.muted, marginTop: 2 },
});
