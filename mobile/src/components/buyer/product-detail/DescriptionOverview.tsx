import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '@/src/constants/theme';
import { splitDescriptionBullets } from '@/src/lib/productFormat';

import { SectionCard } from './SectionCard';

type DescriptionOverviewProps = {
  description: string;
};

export function DescriptionOverview({ description }: DescriptionOverviewProps) {
  const bullets = splitDescriptionBullets(description);

  return (
    <SectionCard title="Overview" subtitle="Product summary">
      {bullets.length <= 1 ? (
        <Text style={styles.body}>{description}</Text>
      ) : (
        <View style={styles.list}>
          {bullets.map((bullet, index) => (
            <View key={`bullet-${index}`} style={styles.item}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.body}>{bullet}</Text>
            </View>
          ))}
        </View>
      )}
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.sm,
  },
  item: {
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'flex-start',
  },
  bullet: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  body: {
    flex: 1,
    color: colors.textStrong,
    fontSize: 15,
    lineHeight: 22,
  },
});
