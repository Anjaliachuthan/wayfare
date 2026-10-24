import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Place } from '../data/mock';
import { colors, font, radius } from '../theme';

type Props = { from: Place; to: Place; compact?: boolean };

/** Pickup (orange dot) → Drop-off (black square) summary used on Trip Ready and Route View. */
export default function RouteSummary({ from, to, compact }: Props) {
  const line = (p: Place) => (compact ? `${p.title} · ${p.subtitle.split(' · ')[0]}` : p.title);
  return (
    <View style={[styles.box, compact && { paddingVertical: 10 }]}>
      <View style={styles.rail}>
        <View style={styles.dot} />
        <View style={styles.line} />
        <View style={styles.square} />
      </View>
      <View style={{ flex: 1, gap: compact ? 6 : 14 }}>
        <View>
          {!compact && <Text style={styles.cap}>Pickup</Text>}
          <Text style={styles.text} numberOfLines={1}>{line(from)}</Text>
          {!compact && <Text style={styles.sub} numberOfLines={1}>{from.subtitle}</Text>}
        </View>
        <View>
          {!compact && <Text style={styles.cap}>Drop-off</Text>}
          <Text style={styles.text} numberOfLines={1}>{line(to)}</Text>
          {!compact && <Text style={styles.sub} numberOfLines={1}>{to.subtitle}</Text>}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { flexDirection: 'row', gap: 12, backgroundColor: colors.bg, borderRadius: radius.md, padding: 14 },
  rail: { alignItems: 'center', paddingTop: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  line: { flex: 1, width: 1, backgroundColor: '#D5D8DD', marginVertical: 3 },
  square: { width: 8, height: 8, backgroundColor: colors.dark },
  cap: { fontSize: 10, color: colors.muted, marginBottom: 2 },
  text: { fontSize: font.sm, fontWeight: '600', color: colors.text },
  sub: { fontSize: 11, color: colors.muted, marginTop: 1 },
});
