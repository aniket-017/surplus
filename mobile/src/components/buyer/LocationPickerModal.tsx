import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { POPULAR_CITIES, type CityOption } from '@/src/constants/cities';
import { colors, spacing } from '@/src/constants/theme';
import { useAuth } from '@/src/context/AuthContext';
import { useBuyerLocation } from '@/src/context/LocationContext';
import { formatBuyerLocation } from '@/src/types/location';

type LocationPickerModalProps = {
  visible: boolean;
  onClose: () => void;
};

export function LocationPickerModal({ visible, onClose }: LocationPickerModalProps) {
  const { user } = useAuth();
  const { location, detectingLocation, setManualLocation, detectCurrentLocation, clearLocation } =
    useBuyerLocation();

  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const profileCity = user?.address?.city?.trim() || '';
  const profileState = user?.address?.state?.trim() || '';

  const filteredCities = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return POPULAR_CITIES;

    return POPULAR_CITIES.filter(
      (option) =>
        option.city.toLowerCase().includes(query) || option.state.toLowerCase().includes(query),
    );
  }, [search]);

  const customEntry = search.trim();
  const showCustomEntry =
    customEntry.length > 1 &&
    !filteredCities.some((option) => option.city.toLowerCase() === customEntry.toLowerCase());

  function closeModal() {
    setSearch('');
    setError('');
    onClose();
  }

  async function handleUseCurrentLocation() {
    setError('');
    try {
      await detectCurrentLocation();
      closeModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not detect your location');
    }
  }

  async function handleSelectCity(option: CityOption) {
    setError('');
    try {
      await setManualLocation(option.city, option.state);
      closeModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save location');
    }
  }

  async function handleUseProfileAddress() {
    if (!profileCity) return;
    await handleSelectCity({ city: profileCity, state: profileState });
  }

  async function handleClearLocation() {
    setError('');
    await clearLocation();
    closeModal();
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={closeModal}>
      <View style={styles.backdrop}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.sheetWrap}
        >
          <View style={styles.sheet}>
            <View style={styles.handle} />

            <View style={styles.headerRow}>
              <Text style={styles.title}>Choose your location</Text>
              <Pressable onPress={closeModal} hitSlop={8} style={styles.closeButton}>
                <Ionicons name="close" size={20} color={colors.textStrong} />
              </Pressable>
            </View>

            {location ? (
              <View style={styles.currentRow}>
                <Ionicons name="location" size={14} color={colors.accent} />
                <Text style={styles.currentText} numberOfLines={1}>
                  Current: {formatBuyerLocation(location)}
                </Text>
                <Pressable onPress={handleClearLocation} hitSlop={8}>
                  <Text style={styles.clearText}>Clear</Text>
                </Pressable>
              </View>
            ) : null}

            <Pressable
              style={styles.gpsButton}
              onPress={handleUseCurrentLocation}
              disabled={detectingLocation}
            >
              {detectingLocation ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Ionicons name="navigate" size={18} color={colors.white} />
              )}
              <Text style={styles.gpsButtonText}>
                {detectingLocation ? 'Detecting your location…' : 'Use my current location'}
              </Text>
            </Pressable>

            {profileCity ? (
              <Pressable style={styles.profileButton} onPress={handleUseProfileAddress}>
                <Ionicons name="home-outline" size={18} color={colors.textStrong} />
                <View style={styles.profileTextWrap}>
                  <Text style={styles.profileLabel}>Use profile address</Text>
                  <Text style={styles.profileValue} numberOfLines={1}>
                    {profileCity}
                    {profileState ? `, ${profileState}` : ''}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.muted} />
              </Pressable>
            ) : null}

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <View style={styles.searchBox}>
              <Ionicons name="search" size={18} color={colors.muted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search or type your city"
                placeholderTextColor={colors.muted}
                value={search}
                onChangeText={(text) => {
                  setSearch(text);
                  setError('');
                }}
                autoCorrect={false}
              />
              {search ? (
                <Pressable onPress={() => setSearch('')} hitSlop={8}>
                  <Ionicons name="close-circle" size={18} color={colors.muted} />
                </Pressable>
              ) : null}
            </View>

            <FlatList
              data={filteredCities}
              keyExtractor={(item) => `${item.city}-${item.state}`}
              keyboardShouldPersistTaps="handled"
              style={styles.list}
              ListHeaderComponent={
                showCustomEntry ? (
                  <Pressable
                    style={styles.cityRow}
                    onPress={() => handleSelectCity({ city: customEntry, state: '' })}
                  >
                    <Ionicons name="add-circle-outline" size={18} color={colors.accent} />
                    <Text style={styles.cityText}>Use "{customEntry}"</Text>
                  </Pressable>
                ) : null
              }
              renderItem={({ item }) => {
                const selected =
                  location?.city.toLowerCase() === item.city.toLowerCase() &&
                  (location?.state || '').toLowerCase() === item.state.toLowerCase();

                return (
                  <Pressable style={styles.cityRow} onPress={() => handleSelectCity(item)}>
                    <Ionicons
                      name={selected ? 'location' : 'location-outline'}
                      size={18}
                      color={selected ? colors.accent : colors.muted}
                    />
                    <Text style={[styles.cityText, selected && styles.cityTextSelected]}>
                      {item.city}
                      <Text style={styles.cityState}>, {item.state}</Text>
                    </Text>
                    {selected ? (
                      <Ionicons name="checkmark" size={18} color={colors.accent} />
                    ) : null}
                  </Pressable>
                );
              }}
              ListEmptyComponent={
                showCustomEntry ? null : (
                  <Text style={styles.emptyText}>No matching cities. Type to add your own.</Text>
                )
              }
            />
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 27, 45, 0.45)',
    justifyContent: 'flex-end',
  },
  sheetWrap: {
    maxHeight: '85%',
  },
  sheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: colors.textStrong,
    fontSize: 18,
    fontWeight: '800',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  currentText: {
    flex: 1,
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  clearText: {
    color: colors.error,
    fontSize: 13,
    fontWeight: '700',
  },
  gpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 14,
  },
  gpsButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: spacing.sm,
    paddingVertical: 12,
    backgroundColor: colors.surface,
  },
  profileTextWrap: {
    flex: 1,
    gap: 1,
  },
  profileLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '600',
  },
  profileValue: {
    color: colors.textStrong,
    fontSize: 14,
    fontWeight: '700',
  },
  error: {
    color: colors.error,
    fontSize: 13,
    lineHeight: 18,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surface,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    color: colors.textStrong,
    fontSize: 14,
  },
  list: {
    maxHeight: 320,
  },
  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  cityText: {
    flex: 1,
    color: colors.textStrong,
    fontSize: 14,
    fontWeight: '600',
  },
  cityTextSelected: {
    color: colors.accent,
  },
  cityState: {
    color: colors.muted,
    fontWeight: '500',
  },
  emptyText: {
    color: colors.muted,
    fontSize: 13,
    paddingVertical: spacing.sm,
    textAlign: 'center',
  },
});

