import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { KeyboardAwareScrollView, ScrollIntoView } from '@/src/components/KeyboardAwareScrollView';
import { useAuth } from '@/src/context/AuthContext';
import { colors, spacing } from '@/src/constants/theme';
import type { UserAddress, UserRole } from '@/src/types/auth';

const emptyAddress = (): UserAddress => ({
  address: '',
  city: '',
  state: '',
  pincode: '',
});

type ProfileScreenProps = {
  role: UserRole;
};

export function ProfileScreen({ role }: ProfileScreenProps) {
  const { user, signOut, setRole, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [address, setAddress] = useState<UserAddress>(user?.address || emptyAddress());
  const [saving, setSaving] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setName(user?.name || '');
    setAddress(user?.address || emptyAddress());
  }, [user]);

  const displayName = user?.name || user?.email || 'User';
  const switchLabel = role === 'buyer' ? 'Switch to Seller' : 'Switch to Buyer';

  async function handleSave() {
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const payload: {
        name?: string;
        address?: {
          address?: string | null;
          city: string;
          state: string;
          pincode: string;
        };
      } = { name };

      if (address.city.trim() || address.state.trim() || address.pincode.trim() || address.address?.trim()) {
        if (!address.city.trim() || !address.state.trim() || !address.pincode.trim()) {
          throw new Error('City, state, and pincode are required when saving an address');
        }

        payload.address = {
          address: address.address?.trim() || null,
          city: address.city.trim(),
          state: address.state.trim(),
          pincode: address.pincode.trim(),
        };
      }

      await updateProfile(payload);
      setMessage('Profile saved successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  }

  async function handleSwitchRole() {
    const nextRole = role === 'buyer' ? 'seller' : 'buyer';
    setSwitching(true);
    setError('');

    try {
      await setRole(nextRole);
      router.replace(nextRole === 'buyer' ? '/(buyer)/(tabs)' : '/(seller)/(tabs)');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to switch role');
    } finally {
      setSwitching(false);
    }
  }

  async function handleSignOut() {
    await signOut();
    router.replace('/(auth)/sign-in');
  }

  function updateAddressField(field: keyof UserAddress, value: string) {
    setAddress((current) => ({ ...current, [field]: value }));
  }

  return (
    <KeyboardAwareScrollView contentContainerStyle={styles.container}>
      <View style={styles.accountCard}>
        {user?.avatarUrl ? (
          <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarInitial}>{displayName[0]?.toUpperCase()}</Text>
          </View>
        )}
        <View style={styles.accountInfo}>
          <Text style={styles.accountName}>{displayName}</Text>
          <Text style={styles.accountEmail}>{user?.email}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>{role.toUpperCase()}</Text>
          </View>
        </View>
      </View>

      <SectionCard title="Personal details" subtitle="Update how your account appears">
        <Field label="Full name">
          <ScrollIntoView>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor={colors.muted}
            />
          </ScrollIntoView>
        </Field>
      </SectionCard>

      <SectionCard title="Address" subtitle="Used for pickup, delivery, and account verification">
        <Field label="Street address">
          <ScrollIntoView>
            <TextInput
              style={styles.input}
              value={address.address || ''}
              onChangeText={(text) => updateAddressField('address', text)}
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
                  value={address.city}
                  onChangeText={(text) => updateAddressField('city', text)}
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
                  value={address.state}
                  onChangeText={(text) => updateAddressField('state', text)}
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
              value={address.pincode}
              onChangeText={(text) =>
                updateAddressField('pincode', text.replace(/\D/g, '').slice(0, 6))
              }
              placeholder="6-digit pincode"
              placeholderTextColor={colors.muted}
              keyboardType="number-pad"
              maxLength={6}
            />
          </ScrollIntoView>
        </Field>
      </SectionCard>

      {message ? <Text style={styles.success}>{message}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        style={[styles.button, styles.buttonPrimary, saving && styles.buttonDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.buttonPrimaryText}>Save profile</Text>
        )}
      </Pressable>

      <View style={styles.actionsCard}>
        <Text style={styles.actionsTitle}>Account actions</Text>
        <Pressable
          style={[styles.button, styles.buttonOutline, switching && styles.buttonDisabled]}
          onPress={handleSwitchRole}
          disabled={switching}
        >
          {switching ? (
            <ActivityIndicator color={colors.accent} />
          ) : (
            <Text style={styles.buttonOutlineText}>{switchLabel}</Text>
          )}
        </Pressable>

        <Pressable style={[styles.button, styles.buttonGhost]} onPress={handleSignOut}>
          <Text style={styles.buttonGhostText}>Sign out</Text>
        </Pressable>
      </View>
    </KeyboardAwareScrollView>
  );
}

function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
      </View>
      {children}
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
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarFallback: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: colors.textStrong,
    fontWeight: '800',
    fontSize: 24,
  },
  accountInfo: {
    flex: 1,
    gap: 4,
  },
  accountName: {
    color: colors.textStrong,
    fontSize: 18,
    fontWeight: '800',
  },
  accountEmail: {
    color: colors.muted,
    fontSize: 14,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    marginTop: 4,
    backgroundColor: 'rgba(92, 179, 53, 0.12)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.borderAccent,
  },
  roleBadgeText: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  sectionHeader: {
    gap: 4,
    marginBottom: 4,
  },
  sectionTitle: {
    color: colors.textStrong,
    fontSize: 18,
    fontWeight: '800',
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
  success: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '600',
  },
  error: {
    color: colors.error,
    fontSize: 14,
  },
  button: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  buttonPrimary: {
    backgroundColor: colors.accent,
  },
  buttonPrimaryText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  buttonOutline: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.accent,
  },
  buttonOutlineText: {
    color: colors.accent,
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  buttonGhost: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  buttonGhostText: {
    color: colors.error,
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  actionsCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  actionsTitle: {
    color: colors.textStrong,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
});
