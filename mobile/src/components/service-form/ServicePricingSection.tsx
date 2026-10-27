import { useRef } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ScrollIntoView } from '@/src/components/KeyboardAwareScrollView';
import { Field, formStyles, SectionHeader } from '@/src/components/service-form/shared';
import { colors, spacing } from '@/src/constants/theme';
import {
  SERVICE_PRICE_TYPE_OPTIONS,
  type ServiceFormValues,
  type ServicePriceType,
} from '@/src/types/service';

const RATE_UNIT_OPTIONS = SERVICE_PRICE_TYPE_OPTIONS.filter((option) => option.value !== 'quote');

const UNIT_SUFFIX: Record<string, string> = {
  per_hour: '/ hour',
  per_piece: '/ piece',
  per_job: '/ job',
  per_kg: '/ kg',
};

type ServicePricingSectionProps = {
  values: ServiceFormValues;
  onChange: (values: ServiceFormValues) => void;
  showHeader?: boolean;
};

export function ServicePricingSection({
  values,
  onChange,
  showHeader = true,
}: ServicePricingSectionProps) {
  const lastRateUnitRef = useRef<ServicePriceType>(
    values.priceType === 'quote' ? 'per_hour' : values.priceType,
  );
  const isQuote = values.priceType === 'quote';

  function updateField<K extends keyof ServiceFormValues>(key: K, value: ServiceFormValues[K]) {
    onChange({ ...values, [key]: value });
  }

  function chooseMode(quote: boolean) {
    if (quote === isQuote) return;
    if (quote) {
      lastRateUnitRef.current = values.priceType;
      updateField('priceType', 'quote');
    } else {
      updateField('priceType', lastRateUnitRef.current);
    }
  }

  return (
    <View style={formStyles.container}>
      {showHeader ? <SectionHeader title="Pricing" subtitle="How you charge for this service" /> : null}

      <View style={styles.modeRow}>
        <PricingOption
          title="Set a rate"
          subtitle="Show a starting price"
          icon="pricetag-outline"
          active={!isQuote}
          onPress={() => chooseMode(false)}
        />
        <PricingOption
          title="Quote after enquiry"
          subtitle="Price depends on the job"
          icon="chatbubbles-outline"
          active={isQuote}
          onPress={() => chooseMode(true)}
        />
      </View>

      {!isQuote ? (
        <>
          <Field label="Charged">
            <View style={formStyles.chipRow}>
              {RATE_UNIT_OPTIONS.map((option) => {
                const active = values.priceType === option.value;
                return (
                  <Pressable
                    key={option.value}
                    style={[formStyles.chip, active && formStyles.chipActive]}
                    onPress={() => updateField('priceType', option.value)}
                  >
                    <Text style={[formStyles.chipText, active && formStyles.chipTextActive]}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Field>

          <Field label="Rate (₹)">
            <ScrollIntoView>
              <View style={styles.rateInputWrap}>
                <Text style={styles.rupee}>₹</Text>
                <TextInput
                  style={styles.rateInput}
                  value={values.price}
                  onChangeText={(text) => updateField('price', text.replace(/[^\d.]/g, ''))}
                  placeholder="e.g. 450"
                  placeholderTextColor={colors.muted}
                  keyboardType="decimal-pad"
                />
                <Text style={styles.unit}>{UNIT_SUFFIX[values.priceType] ?? ''}</Text>
              </View>
            </ScrollIntoView>
          </Field>
        </>
      ) : null}

      <Field
        label="Minimum charge (optional)"
        hint="The least you charge for any order, e.g. ₹2000 even for a single small part."
      >
        <ScrollIntoView>
          <TextInput
            style={formStyles.input}
            value={values.minimumCharge}
            onChangeText={(text) => updateField('minimumCharge', text.replace(/[^\d.]/g, ''))}
            placeholder="e.g. 2000"
            placeholderTextColor={colors.muted}
            keyboardType="decimal-pad"
          />
        </ScrollIntoView>
      </Field>
    </View>
  );
}

function PricingOption({
  title,
  subtitle,
  icon,
  active,
  onPress,
}: {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.modeCard, active && styles.modeCardActive]}
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected: active }}
    >
      <Ionicons name={icon} size={20} color={active ? colors.accent : colors.muted} />
      <Text style={[styles.modeTitle, active && styles.modeTitleActive]}>{title}</Text>
      <Text style={styles.modeSubtitle}>{subtitle}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  modeRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  modeCard: {
    flex: 1,
    gap: 4,
    padding: spacing.sm,
    borderRadius: 14,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  modeCardActive: {
    backgroundColor: 'rgba(92, 179, 53, 0.08)',
    borderColor: colors.accent,
  },
  modeTitle: {
    color: colors.textStrong,
    fontSize: 14,
    fontWeight: '700',
  },
  modeTitleActive: {
    color: colors.accentHover,
  },
  modeSubtitle: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 16,
  },
  rateInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: colors.surfaceMuted,
  },
  rupee: {
    color: colors.textStrong,
    fontSize: 16,
    fontWeight: '700',
    marginRight: 6,
  },
  rateInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.textStrong,
  },
  unit: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '600',
  },
});
