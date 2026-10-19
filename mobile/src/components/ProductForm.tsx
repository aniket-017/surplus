import type { ReactNode } from 'react';
import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, spacing } from '@/src/constants/theme';
import { ScrollIntoView } from '@/src/components/KeyboardAwareScrollView';
import { CategorySelect } from '@/src/components/CategorySelect';
import {
  MapAddressPickerModal,
  type PickedAddress,
} from '@/src/components/MapAddressPickerModal';
import type { UserAddress } from '@/src/types/auth';
import {
  CONDITION_OPTIONS,
  formatAttributeKey,
  isCompleteLocation,
  PRICE_TYPE_OPTIONS,
  type ProductFormValues,
} from '@/src/types/product';

type ProductFormProps = {
  values: ProductFormValues;
  onChange: (values: ProductFormValues) => void;
  profileAddress?: UserAddress | null;
};

export function ProductForm({ values, onChange, profileAddress }: ProductFormProps) {
  const [mapPickerVisible, setMapPickerVisible] = useState(false);

  function updateField<K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) {
    onChange({ ...values, [key]: value });
  }

  function applyAddressFromMap(picked: PickedAddress) {
    onChange({
      ...values,
      location: {
        address: picked.address,
        city: picked.city,
        state: picked.state,
        pincode: picked.pincode,
        latitude: picked.latitude,
        longitude: picked.longitude,
      },
    });
    setMapPickerVisible(false);
  }

  const mapInitialAddress: UserAddress = {
    address: values.location.address || '',
    city: values.location.city,
    state: values.location.state,
    pincode: values.location.pincode,
    latitude: values.location.latitude ?? profileAddress?.latitude ?? null,
    longitude: values.location.longitude ?? profileAddress?.longitude ?? null,
  };

  function updateAttribute(index: number, field: 'key' | 'value', value: string) {
    const attributes = values.attributes.map((item, i) =>
      i === index ? { ...item, [field]: value } : item,
    );
    updateField('attributes', attributes);
  }

  function handleAttributeKeyBlur(index: number) {
    const current = values.attributes[index];
    if (!current) return;
    const formatted = formatAttributeKey(current.key);
    if (formatted === current.key) return;
    updateAttribute(index, 'key', formatted);
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

      <Field label="Category">
        <ScrollIntoView>
          <CategorySelect
            value={values.category}
            onChange={(category) => updateField('category', category)}
          />
        </ScrollIntoView>
      </Field>

      <Field label="Sub-category">
        <ScrollIntoView>
          <TextInput
            style={styles.input}
            value={values.subCategory}
            onChangeText={(text) => updateField('subCategory', text)}
            placeholder="e.g. LED Searchlight"
            placeholderTextColor={colors.muted}
          />
        </ScrollIntoView>
      </Field>

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

      <View style={styles.attributesHeader}>
        <View style={styles.attributesHeaderCopy}>
          <Text style={styles.sectionTitle}>Attributes</Text>
          <Text style={styles.sectionSubtitle}>
            {values.attributes.length
              ? `${values.attributes.length} ${
                  values.attributes.length === 1 ? 'specification' : 'specifications'
                }`
              : 'Optional specs from AI or added manually'}
          </Text>
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.addAttributeButton,
            pressed && styles.addAttributePressed,
          ]}
          onPress={addAttribute}
          accessibilityRole="button"
          accessibilityLabel="Add attribute"
        >
          <Ionicons name="add" size={16} color={colors.accent} />
          <Text style={styles.addAttributeText}>Add</Text>
        </Pressable>
      </View>

      {values.attributes.length === 0 ? (
        <View style={styles.emptyAttributes}>
          <Ionicons name="list-outline" size={20} color={colors.accent} />
          <Text style={styles.emptyAttributesText}>
            No specifications yet. Analyze images or tap Add.
          </Text>
        </View>
      ) : (
        <View style={styles.attributesList}>
          {values.attributes.map((attribute, index) => (
            <View
              key={`attr-${index}`}
              style={[
                styles.attributeRow,
                index < values.attributes.length - 1 && styles.attributeRowBorder,
              ]}
            >
              <View style={styles.attributeRowBody}>
                <ScrollIntoView>
                  <TextInput
                    style={styles.attributeKeyInput}
                    value={attribute.key}
                    onChangeText={(text) => updateAttribute(index, 'key', text)}
                    onBlur={() => handleAttributeKeyBlur(index)}
                    placeholder="Property name"
                    placeholderTextColor={colors.muted}
                    autoCapitalize="words"
                  />
                </ScrollIntoView>
                <View style={styles.attributeValueRow}>
                  <ScrollIntoView style={styles.attributeValueFlex}>
                    <TextInput
                      style={styles.attributeValueInput}
                      value={attribute.value}
                      onChangeText={(text) => updateAttribute(index, 'value', text)}
                      placeholder="Value"
                      placeholderTextColor={colors.muted}
                      multiline
                      textAlignVertical="top"
                    />
                  </ScrollIntoView>
                  <Ionicons
                    name="create-outline"
                    size={16}
                    color={colors.muted}
                    style={styles.attributeEditIcon}
                  />
                </View>
              </View>
              <Pressable
                style={styles.removeAttributeBtn}
                onPress={() => removeAttribute(index)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${attribute.key || `attribute ${index + 1}`}`}
              >
                <Ionicons name="close" size={16} color={colors.muted} />
              </Pressable>
            </View>
          ))}
        </View>
      )}

      <SectionHeader
        title="Pricing and stock"
        subtitle="Quantity, price, and listing condition"
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
          {PRICE_TYPE_OPTIONS.map((option) => {
            const active = values.priceType === option.value;
            return (
              <Pressable
                key={option.value}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => updateField('priceType', option.value)}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Field>

      <Field label="Condition">
        <View style={styles.chipRow}>
          {CONDITION_OPTIONS.map((option) => {
            const active = values.condition === option.value;
            return (
              <Pressable
                key={option.value}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => updateField('condition', option.value)}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Field>

      <SectionHeader title="Location" subtitle="Pickup location for this listing" />

      {isCompleteLocation(values.location) ? (
        <View style={styles.locationCard}>
          <View style={styles.locationIcon}>
            <Ionicons name="location" size={18} color={colors.accent} />
          </View>
          <View style={styles.locationTextWrap}>
            <Text style={styles.locationTitle} numberOfLines={2}>
              {values.location.address?.trim() || values.location.city}
            </Text>
            <Text style={styles.locationSubtitle} numberOfLines={2}>
              {[values.location.city, values.location.state].filter(Boolean).join(', ')}
              {values.location.pincode ? ` - ${values.location.pincode}` : ''}
            </Text>
          </View>
          <Pressable
            style={styles.changeLocationButton}
            onPress={() => setMapPickerVisible(true)}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel="Change pickup location on map"
          >
            <Text style={styles.changeLocationText}>Change</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          style={({ pressed }) => [styles.mapButton, pressed && styles.mapButtonPressed]}
          onPress={() => setMapPickerVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="Pick location from map"
        >
          <View style={styles.mapButtonIcon}>
            <Ionicons name="map-outline" size={20} color={colors.accent} />
          </View>
          <View style={styles.mapButtonTextWrap}>
            <Text style={styles.mapButtonTitle}>Pick from map</Text>
            <Text style={styles.mapButtonSubtitle}>
              Search or drag the pin to set the pickup location
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.accent} />
        </Pressable>
      )}

      <MapAddressPickerModal
        visible={mapPickerVisible}
        initialAddress={mapInitialAddress}
        onClose={() => setMapPickerVisible(false)}
        onConfirm={applyAddressFromMap}
      />
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
    paddingTop: spacing.lg,
    marginTop: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(15, 27, 45, 0.1)',
  },
  sectionHeaderFirst: {
    borderTopWidth: 0,
    paddingTop: 0,
    marginTop: 0,
  },
  sectionTitle: {
    color: colors.textStrong,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  field: {
    gap: 8,
  },
  label: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    borderWidth: 0,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.textStrong,
    backgroundColor: colors.surfaceMuted,
  },
  textArea: {
    minHeight: 110,
    textAlignVertical: 'top',
    lineHeight: 22,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  rowItem: {
    flex: 1,
  },
  rowItemWide: {
    flex: 1.35,
  },
  emptyAttributes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: 2,
  },
  emptyAttributesText: {
    flex: 1,
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  attributesHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingTop: spacing.lg,
    marginTop: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(15, 27, 45, 0.1)',
  },
  attributesHeaderCopy: {
    flex: 1,
    gap: 4,
  },
  attributesList: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 14,
    overflow: 'hidden',
  },
  attributeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  attributeRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(15, 27, 45, 0.08)',
  },
  attributeRowBody: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  attributeKeyInput: {
    width: '100%',
    paddingHorizontal: 0,
    paddingVertical: 0,
    margin: 0,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: colors.muted,
    backgroundColor: 'transparent',
  },
  attributeValueRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  attributeValueFlex: {
    flex: 1,
    minWidth: 0,
  },
  attributeValueInput: {
    width: '100%',
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
    margin: 0,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '700',
    color: colors.textStrong,
    backgroundColor: 'transparent',
  },
  attributeEditIcon: {
    marginTop: 2,
  },
  removeAttributeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -2,
  },
  addAttributeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(92, 179, 53, 0.12)',
    marginTop: 2,
  },
  addAttributePressed: {
    opacity: 0.7,
  },
  addAttributeText: {
    color: colors.accent,
    fontWeight: '700',
    fontSize: 13,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.surfaceMuted,
  },
  chipActive: {
    backgroundColor: colors.accent,
  },
  chipText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextActive: {
    color: colors.white,
    fontWeight: '700',
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 14,
    padding: spacing.md,
  },
  locationIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(92, 179, 53, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationTextWrap: {
    flex: 1,
    gap: 2,
  },
  locationTitle: {
    color: colors.textStrong,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  locationSubtitle: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  changeLocationButton: {
    borderWidth: 1.5,
    borderColor: colors.accent,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: colors.white,
  },
  changeLocationText: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '700',
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.accent,
    borderRadius: 14,
    backgroundColor: '#F7FCF8',
    paddingHorizontal: spacing.sm,
    paddingVertical: 14,
  },
  mapButtonPressed: {
    opacity: 0.85,
  },
  mapButtonIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapButtonTextWrap: {
    flex: 1,
    gap: 2,
  },
  mapButtonTitle: {
    color: colors.textStrong,
    fontSize: 15,
    fontWeight: '700',
  },
  mapButtonSubtitle: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 16,
  },
});
