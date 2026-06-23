import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/src/constants/theme';

import { SectionCard } from './SectionCard';

type InquiryUrgencyProps = {
  inquiryCount: number;
};

export function InquiryUrgency({ inquiryCount }: InquiryUrgencyProps) {
  if (inquiryCount <= 0) return null;

  return (
    <SectionCard title="Interest">
      <View style={styles.row}>
        <Text style={styles.text}>
          {inquiryCount} buyer{inquiryCount === 1 ? '' : 's'} interested
        </Text>
      </View>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingVertical: 4,
  },
  text: {
    color: colors.textStrong,
    fontSize: 15,
    fontWeight: '600',
  },
});
