import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import { colors, spacing } from '@/src/constants/theme';
import { ScrollIntoView } from '@/src/components/KeyboardAwareScrollView';
import { CategorySelect } from '@/src/components/CategorySelect';
import type { UserAddress } from '@/src/types/auth';
import {
  CONDITION_OPTIONS,
  isCompleteLocation,
  PRICE_TYPE_OPTIONS,
  profileAddressToLocation,
  type ProductFormValues,
} from '@/src/types/product';

type ProductFormProps = {
  values: ProductFormValues;
  onChange: (values: ProductFormValues) => void;
  profileAddress?: UserAddress | null;
};

export function ProductForm({ values, onChange, profileAddress }: ProductFormProps) {
  const hasProfileAddress = Boolean(profileAddress && isCompleteLocation(profileAddress));
  const [useProfileAddress, setUseProfileAddress] = useState(hasProfileAddress);

  useEffect(() => {
    if (hasProfileAddress) {
      setUseProfileAddress(true);
    }
  }, [hasProfileAddress]);

  function handleUseProfileAddressToggle(enabled: boolean) {
    setUseProfileAddress(enabled);

    if (enabled && profileAddress && isCompleteLocation(profileAddress)) {
      onChange({
        ...values,
        location: profileAddressToLocation(profileAddress),
      });
    }
  }
  function updateField<K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) {
    onChange({ ...values, [key]: value });
  }

  function updateLocation(field: keyof ProductFormValues['location'], value: string) {
    onChange({
      ...values,
      location: { ...values.location, [field]: value },
    });
  }

  function updateAttribute(index: number, field: 'key' | 'value', value: string) {
    const attributes = values.attributes.map((item, i) =>
      i === index ? { ...item, [field]: value } : item,
    );
    updateField('attributes', attributes);
  }

  function addAttribute() {
    updateField('attributes', [...values.attributes, { key: '', value: '' }]);
  }

  function removeAttribute(index: number) {
    updateField(
      'attributes',
      values.attributes.filter((_, i) => i !== index),
    );
  }

  return (
    <View style={styles.container}>
      <SectionHeader
        title="Product details"
        subtitle="Review and edit AI-generated listing information"
        showDivider={false}
      />

      <Field label="Title">
        <ScrollIntoView>
          <TextInput
            style={styles.input}
            value={values.title}
            onChangeText={(text) => updateField('title', text)}
            placeholder="Product title"
            placeholderTextColor={colors.muted}
          />
        </ScrollIntoView>
      </Field>

      <View style={styles.row}>
        <View style={styles.rowItem}>
          <Field label="Category">
            <ScrollIntoView>
              <CategorySelect
                value={values.category}
                onChange={(category) => updateField('category', category)}
              />
            </ScrollIntoView>
          </Field>
        </View>
        <View style={styles.rowItem}>
          <Field label="Sub-category">
            <ScrollIntoView>
              <TextInput
                style={styles.input}
                value={values.subCategory}
                onChangeText={(text) => updateField('subCategory', text)}
                placeholder="Copper Scrap"
                placeholderTextColor={colors.muted}
              />
            </ScrollIntoView>
          </Field>
        </View>
      </View>

      <Field label="Description">
        <ScrollIntoView>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={values.description}
            onChangeText={(text) => updateField('description', text)}
            placeholder="Describe the material or equipment"
            placeholderTextColor={colors.muted}
            multiline
          />
        </ScrollIntoView>
      </Field>

      <SectionHeader
        title="Attributes"
        subtitle="Material-specific properties detected from your images"
      />

      {values.attributes.length === 0 ? (
        <View style={styles.emptyAttributes}>
          <Text style={styles.emptyAttributesText}>
            No attributes yet. Analyze images with AI or add properties manually.
          </Text>
        </View>
      ) : (
        values.attributes.map((attribute, index) => (
          <View key={`attr-${index}`} style={styles.attributeCard}>
            <View style={styles.attributeHeader}>
              <View style={styles.attributeBadge}>
                <Text style={styles.attributeBadgeText}>{index + 1}</Text>
              </View>
              <Text style={styles.attributeTitle}>Attribute {index + 1}</Text>
              <Pressable
                style={styles.removeButton}
                onPress={() => removeAttribute(index)}
                hitSlop={8}
              >
                <Text style={styles.removeButtonText}>Remove</Text>
              </Pressable>
            </View>

            <View style={styles.attributeFields}>
              <View style={styles.attributeField}>
                <Text style={styles.attributeLabel}>Property</Text>
                <ScrollIntoView>
                  <TextInput
                    style={styles.input}
                    value={attribute.key}
                    onChangeText={(text) => updateAttribute(index, 'key', text)}
                    placeholder="e.g. purity"
                    placeholderTextColor={colors.muted}
                    autoCapitalize="none"
                  />
                </ScrollIntoView>
              </View>
              <View style={styles.attributeDivider} />
              <View style={styles.attributeField}>
                <Text style={styles.attributeLabel}>Value</Text>
                <ScrollIntoView>
                  <TextInput
                    style={styles.input}
                    value={attribute.value}
                    onChangeText={(text) => updateAttribute(index, 'value', text)}
                    placeholder="e.g. 99%"
                    placeholderTextColor={colors.muted}
                  />
                </ScrollIntoView>
              </View>
            </View>
          </View>
        ))
      )}

      <Pressable style={styles.addAttributeButton} onPress={addAttribute}>
        <Text style={styles.addAttributeIcon}>+</Text>
        <Text style={styles.addAttributeText}>Add attribute</Text>
      </Pressable>

      <SectionHeader
        title="Pricing and stock"
        subtitle="Set quantity, unit, price, and listing condition"
      />

      <View style={styles.row}>
        <View style={[styles.rowItem, styles.rowItemWide]}>
          <Field label="Quantity">
            <ScrollIntoView>
              <TextInput
                style={styles.input}
                value={values.quantity}
                onChangeText={(text) => updateField('quantity', text.replace(/[^\d.]/g, ''))}
                placeholder="0"
                placeholderTextColor={colors.muted}
                keyboardType="decimal-pad"
              />
            </ScrollIntoView>
          </Field>
        </View>
        <View style={styles.rowItem}>
          <Field label="Unit">
            <ScrollIntoView>
              <TextInput
                style={styles.input}
                value={values.quantityUnit}
                onChangeText={(text) => updateField('quantityUnit', text)}
                placeholder="kg"
                placeholderTextColor={colors.muted}
                autoCapitalize="none"
              />
            </ScrollIntoView>
          </Field>
        </View>
      </View>

      <Field label="Price (₹)">
        <ScrollIntoView>
          <TextInput
            style={styles.input}
            value={values.price}
            onChangeText={(text) => updateField('price', text.replace(/[^\d.]/g, ''))}
            placeholder="Listing price"
            placeholderTextColor={colors.muted}
            keyboardType="decimal-pad"
          />
        </ScrollIntoView>
      </Field>

      <Field label="Price type">
        <View style={styles.chipRow}>
          {PRICE_TYPE_OPTIONS.map((option) => (
            <Pressable
              key={option.value}
              style={[styles.chip, values.priceType === option.value && styles.chipActive]}
              onPress={() => updateField('priceType', option.value)}
            >
              <Text
                style={[
                  styles.chipText,
                  values.priceType === option.value && styles.chipTextActive,
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </Field>

      <Field label="Condition">
        <View style={styles.chipRow}>
          {CONDITION_OPTIONS.map((option) => (
            <Pressable
              key={option.value}
              style={[styles.chip, values.condition === option.value && styles.chipActive]}
              onPress={() => updateField('condition', option.value)}
            >
              <Text
                style={[
                  styles.chipText,
                  values.condition === option.value && styles.chipTextActive,
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </Field>

      <SectionHeader title="Location" subtitle="Where is this material available for pickup?" />

      {hasProfileAddress ? (
        <View style={styles.profileToggleRow}>
          <View style={styles.profileToggleCopy}>
            <Text style={styles.profileToggleLabel}>Use my profile address</Text>
            <Text style={styles.profileToggleHint}>
              Reuse the address saved in your seller profile
            </Text>
          </View>
          <Switch
            value={useProfileAddress}
            onValueChange={handleUseProfileAddressToggle}
            trackColor={{ false: colors.border, true: 'rgba(92, 179, 53, 0.35)' }}
            thumbColor={useProfileAddress ? colors.accent : colors.surface}
          />
        </View>
      ) : (
        <View style={styles.profileHintBox}>
          <Text style={styles.profileHintText}>
            Add an address in your profile to reuse it here, or enter a pickup location below.
          </Text>
        </View>
      )}

      {useProfileAddress && hasProfileAddress && profileAddress ? (
        <View style={styles.profileAddressCard}>
          {profileAddress.address?.trim() ? (
            <Text style={styles.profileAddressLine}>{profileAddress.address.trim()}</Text>
          ) : null}
          <Text style={styles.profileAddressLine}>
            {[profileAddress.city, profileAddress.state].filter(Boolean).join(', ')}
            {profileAddress.pincode ? ` - ${profileAddress.pincode}` : ''}
          </Text>
        </View>
      ) : (
        <>
          <Field label="Address">
            <ScrollIntoView>
              <TextInput
                style={styles.input}
                value={values.location.address || ''}
                onChangeText={(text) => updateLocation('address', text)}
                placeholder="Street address (optional)"
                placeholderTextColor={colors.muted}
              />
            </ScrollIntoView>
          </Field>

          <View style={styles.row}>
            <View style={styles.rowItem}>
              <Field label="City">
                <ScrollIntoView>
                  <TextInput
                    style={styles.input}
                    value={values.location.city}
                    onChangeText={(text) => updateLocation('city', text)}
                    placeholder="City"
                    placeholderTextColor={colors.muted}
                  />
                </ScrollIntoView>
              </Field>
            </View>
            <View style={styles.rowItem}>
              <Field label="State">
                <ScrollIntoView>
                  <TextInput
                    style={styles.input}
                    value={values.location.state}
                    onChangeText={(text) => updateLocation('state', text)}
                    placeholder="State"
                    placeholderTextColor={colors.muted}
                  />
                </ScrollIntoView>
              </Field>
            </View>
          </View>

          <Field label="Pincode">
            <ScrollIntoView>
              <TextInput
                style={[styles.input, styles.pincodeInput]}
                value={values.location.pincode}
                onChangeText={(text) => updateLocation('pincode', text.replace(/\D/g, '').slice(0, 6))}
                placeholder="6-digit pincode"
                placeholderTextColor={colors.muted}
                keyboardType="number-pad"
                maxLength={6}
              />
            </ScrollIntoView>
          </Field>
        </>
      )}
    </View>
  );
}

function SectionHeader({
  title,
  subtitle,
  showDivider = true,
}: {
  title: string;
  subtitle?: string;
  showDivider?: boolean;
}) {
  return (
    <View style={[styles.sectionHeader, !showDivider && styles.sectionHeaderFirst]}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  sectionHeader: {
    gap: 4,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.xs,
  },
  sectionHeaderFirst: {
    borderTopWidth: 0,
    paddingTop: 0,
    marginTop: 0,
  },
  sectionTitle: {
    color: colors.textStrong,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  field: {
    gap: 6,
  },
  label: {
    color: colors.textStrong,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: colors.textStrong,
    backgroundColor: colors.bg,
  },
  textArea: {
    minHeight: 104,
    textAlignVertical: 'top',
  },
  pincodeInput: {
    maxWidth: 180,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  rowItem: {
    flex: 1,
  },
  rowItemWide: {
    flex: 1.4,
  },
  emptyAttributes: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  emptyAttributesText: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  attributeCard: {
    backgroundColor: colors.bgSubtle,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  attributeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  attributeBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attributeBadgeText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '800',
  },
  attributeTitle: {
    flex: 1,
    color: colors.textStrong,
    fontSize: 14,
    fontWeight: '700',
  },
  removeButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(192, 57, 43, 0.08)',
  },
  removeButtonText: {
    color: colors.error,
    fontWeight: '700',
    fontSize: 12,
  },
  attributeFields: {
    flexDirection: 'row',
    padding: spacing.sm,
    gap: spacing.sm,
    alignItems: 'stretch',
  },
  attributeField: {
    flex: 1,
    gap: 6,
  },
  attributeLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    paddingHorizontal: 2,
  },
  attributeDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginVertical: 28,
  },
  addAttributeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: colors.borderAccent,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 14,
    backgroundColor: 'rgba(92, 179, 53, 0.04)',
  },
  addAttributeIcon: {
    color: colors.accent,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 20,
  },
  addAttributeText: {
    color: colors.accent,
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.2,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: colors.surface,
  },
  chipActive: {
    borderColor: colors.accent,
    backgroundColor: 'rgba(92, 179, 53, 0.12)',
  },
  chipText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextActive: {
    color: colors.accent,
    fontWeight: '700',
  },
  profileToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    backgroundColor: colors.bgSubtle,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  profileToggleCopy: {
    flex: 1,
    gap: 4,
  },
  profileToggleLabel: {
    color: colors.textStrong,
    fontSize: 15,
    fontWeight: '700',
  },
  profileToggleHint: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  profileHintBox: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  profileHintText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  profileAddressCard: {
    backgroundColor: colors.bgSubtle,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderAccent,
    padding: spacing.md,
    gap: 4,
  },
  profileAddressLine: {
    color: colors.textStrong,
    fontSize: 14,
    lineHeight: 20,
  },
});