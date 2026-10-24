import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors, font, radius } from '../theme';

type Props = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'outline';
  icon?: React.ReactNode;
  style?: ViewStyle;
};

export default function Button({ title, onPress, disabled, loading, variant = 'primary', icon, style }: Props) {
  const isOutline = variant === 'outline';
  const inactive = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [
        styles.base,
        isOutline ? styles.outline : styles.primary,
        disabled && !isOutline && styles.disabled,
        pressed && { opacity: 0.85 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <>
          {icon}
          <Text
            style={[
              styles.text,
              isOutline && { color: colors.text, fontWeight: '600' },
              disabled && !isOutline && { color: colors.disabledText },
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { height: 52, borderRadius: radius.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primary: { backgroundColor: colors.primary },
  outline: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, height: 44, borderRadius: radius.sm },
  disabled: { backgroundColor: colors.disabled },
  text: { color: '#fff', fontSize: font.md, fontWeight: '700' },
});
