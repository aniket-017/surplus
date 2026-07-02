import { StyleSheet, Text, View } from 'react-native';

import { chatTheme } from '@/src/constants/chatTheme';
import { colors } from '@/src/constants/theme';

type DateSeparatorProps = {
  label: string;
};

export function DateSeparator({ label }: DateSeparatorProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.pill}>
        <Text style={styles.label}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    marginVertical: 10,
  },
  pill: {
    backgroundColor: chatTheme.datePill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: chatTheme.datePillBorder,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  label: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
  },
});
