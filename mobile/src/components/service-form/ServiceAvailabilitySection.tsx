import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import {
  MapAddressPickerModal,
  type PickedAddress,
} from '@/src/components/MapAddressPickerModal';
import { Field, formStyles, SectionHeader } from '@/src/components/service-form/shared';
import { colors, spacing } from '@/src/constants/theme';
import type { UserAddress } from '@/src/types/auth';
import { isCompleteLocation } from '@/src/types/product';
import { SERVICE_MODE_OPTIONS, type ServiceFormValues } from '@/src/types/service';

type ServiceAvailabilitySectionProps = {
  values: ServiceFormValues;
  onChange: (values: ServiceFormValues) => void;
  profileAddress?: UserAddress | null;
  serviceModeAiSuggested?: boolean;
  showHeader?: boolean;
};

export function ServiceAvailabilitySection({
  values,
  onChange,
  profileAddress,
  serviceModeAiSuggested = false,
  showHeader = true,
}: ServiceAvailabilitySectionProps) {
  const [mapPickerVisible, setMapPickerVisible] = useState(false);

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

  return (
    <View style={formStyles.container}>
      {showHeader ? <SectionHeader title="Availability" /> : null}

      <Field label="Where do you provide the service?" aiSuggested={serviceModeAiSuggested}>
        <View style={styles.modeRow}>
          {SERVICE_MODE_OPTIONS.map((option) => {
            const active = values.serviceMode === option.value;
            return (
              <Pressable
                key={option.value}
                style={[styles.modeCard, active && styles.modeCardActive]}
                onPress={() => onChange({ ...values, serviceMode: option.value })}
              >
                <Ionicons
                  name={option.icon as keyof typeof Ionicons.glyphMap}
                  size={20}
                  color={active ? colors.accent : colors.muted}
                />
                <Text style={[styles.modeText, active && styles.modeTextActive]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Field>

      <Field label="Workshop or base location">
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
              accessibilityLabel="Change service location on map"
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
                Search or drag the pin to set your workshop location
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.accent} />
          </Pressable>
        )}
      </Field>

      <MapAddressPickerModal
        visible={mapPickerVisible}
        initialAddress={mapInitialAddress}
        onClose={() => setMapPickerVisible(false)}
        onConfirm={applyAddressFromMap}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  modeRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  modeCard: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderRadius: 14,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  modeCardActive: {
    backgroundColor: 'rgba(92, 179, 53, 0.08)',
    borderColor: colors.accent,
  },
  modeText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  modeTextActive: {
    color: colors.accentHover,
    fontWeight: '800',
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
