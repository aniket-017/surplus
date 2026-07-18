import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { KeyboardAwareScrollView, ScrollIntoView } from '@/src/components/KeyboardAwareScrollView';
import { useAuth } from '@/src/context/AuthContext';
import { colors, spacing } from '@/src/constants/theme';
import type { User, UserAddress, UserRole } from '@/src/types/auth';

const DARK_GREEN = '#1F5C38';
const LIGHT_GREEN = '#E8F5E9';

const emptyAddress = (): UserAddress => ({
  address: '',
  city: '',
  state: '',
  pincode: '',
});

function isPersonalComplete(user: User | null) {
  return Boolean(user?.name?.trim());
}

function isAddressComplete(user: User | null) {
  const addr = user?.address;
  return Boolean(addr?.city?.trim() && addr?.state?.trim() && addr?.pincode?.trim());
}

function isProfileComplete(user: User | null) {
  return isPersonalComplete(user) && isAddressComplete(user);
}

type ProfileScreenProps = {
  role: UserRole;
};

export function ProfileScreen({ role }: ProfileScreenProps) {
  const { user, signOut, setRole, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [address, setAddress] = useState<UserAddress>(user?.address || emptyAddress());
  const [editingPersonal, setEditingPersonal] = useState(!isPersonalComplete(user));
  const [editingAddress, setEditingAddress] = useState(!isAddressComplete(user));
  const [saving, setSaving] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const nameInputRef = useRef<TextInput>(null);
  const streetInputRef = useRef<TextInput>(null);

  const isEditing = editingPersonal || editingAddress;
  const profileComplete = isProfileComplete(user);

  useEffect(() => {
    setName(user?.name || '');
    setAddress(user?.address || emptyAddress());
    setEditingPersonal(!isPersonalComplete(user));
    setEditingAddress(!isAddressComplete(user));
  }, [user]);

  const displayName = user?.name || user?.email || 'User';
  const switchLabel = role === 'buyer' ? 'Switch to Seller' : 'Switch to Buyer';
  const switchSubtitle =
    role === 'buyer' ? 'Start selling surplus items' : 'Browse and buy items';

  function resetFormFromUser() {
    setName(user?.name || '');
    setAddress(user?.address || emptyAddress());
  }

  function enterPersonalEdit() {
    setEditingPersonal(true);
    setTimeout(() => nameInputRef.current?.focus(), 100);
  }

  function enterAddressEdit() {
    setEditingAddress(true);
    setTimeout(() => streetInputRef.current?.focus(), 100);
  }

  function cancelPersonalEdit() {
    setName(user?.name || '');
    if (isPersonalComplete(user)) {
      setEditingPersonal(false);
    }
  }

  function cancelAddressEdit() {
    setAddress(user?.address || emptyAddress());
    if (isAddressComplete(user)) {
      setEditingAddress(false);
    }
  }

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

      if (
        address.city.trim() ||
        address.state.trim() ||
        address.pincode.trim() ||
        address.address?.trim()
      ) {
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
      setEditingPersonal(!name.trim());
      setEditingAddress(
        !address.city.trim() || !address.state.trim() || !address.pincode.trim(),
      );
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
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Profile</Text>
        <Text style={styles.pageSubtitle}>Manage your account and preferences</Text>
      </View>

      {!profileComplete ? (
        <View style={styles.incompleteBanner}>
          <View style={styles.incompleteIconWrap}>
            <Ionicons name="information-circle-outline" size={20} color={DARK_GREEN} />
          </View>
          <View style={styles.incompleteText}>
            <Text style={styles.incompleteTitle}>Complete your profile</Text>
            <Text style={styles.incompleteSubtitle}>
              Add your details to unlock the full Surplus experience.
            </Text>
          </View>
        </View>
      ) : null}

      <View style={styles.userCard}>
        {user?.avatarUrl ? (
          <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarInitial}>{displayName[0]?.toUpperCase()}</Text>
          </View>
        )}
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{displayName}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <View style={styles.roleBadge}>
            <Ionicons
              name={role === 'seller' ? 'storefront-outline' : 'bag-outline'}
              size={12}
              color={DARK_GREEN}
            />
            <Text style={styles.roleBadgeText}>{role.toUpperCase()}</Text>
          </View>
        </View>
        {profileComplete ? (
          <View style={styles.completeBadge}>
            <Ionicons name="checkmark-circle" size={18} color={colors.accent} />
          </View>
        ) : (
          <Ionicons name="chevron-forward" size={20} color={colors.muted} />
        )}
      </View>

      <SectionCard
        icon="person-outline"
        title="Personal Details"
        subtitle={
          editingPersonal
            ? 'Update how your account appears'
            : 'Your account identity on Surplus'
        }
        mode={editingPersonal ? 'edit' : 'view'}
        canCancel={isPersonalComplete(user)}
        onEdit={enterPersonalEdit}
        onCancel={cancelPersonalEdit}
      >
        {editingPersonal ? (
          <Field label="Full Name">
            <ScrollIntoView>
              <TextInput
                ref={nameInputRef}
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                placeholderTextColor={colors.muted}
              />
            </ScrollIntoView>
          </Field>
        ) : (
          <ViewField label="Full Name" value={name || 'Not added yet'} />
        )}
      </SectionCard>

      <SectionCard
        icon="location-outline"
        title="Address"
        subtitle={
          editingAddress
            ? 'Used for pickup, delivery and account verification'
            : 'Your registered location details'
        }
        mode={editingAddress ? 'edit' : 'view'}
        canCancel={isAddressComplete(user)}
        onEdit={enterAddressEdit}
        onCancel={cancelAddressEdit}
      >
        {editingAddress ? (
          <>
            <Field label="Street Address">
              <ScrollIntoView>
                <TextInput
                  ref={streetInputRef}
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
          </>
        ) : (
          <>
            <ViewField
              label="Street Address"
              value={address.address?.trim() || 'Not provided'}
              muted={!address.address?.trim()}
            />
            <View style={styles.viewRow}>
              <View style={styles.viewRowItem}>
                <ViewField label="City" value={address.city || '—'} muted={!address.city} />
              </View>
              <View style={styles.viewRowItem}>
                <ViewField label="State" value={address.state || '—'} muted={!address.state} />
              </View>
            </View>
            <ViewField
              label="Pincode"
              value={address.pincode || '—'}
              muted={!address.pincode}
              compact
            />
          </>
        )}
      </SectionCard>

      {message ? <Text style={styles.success}>{message}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {isEditing ? (
        <View style={styles.saveActions}>
          <Pressable
            style={[styles.saveButton, saving && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <>
                <Ionicons name="save-outline" size={18} color={colors.white} />
                <Text style={styles.saveButtonText}>Save Profile</Text>
              </>
            )}
          </Pressable>

          {profileComplete ? (
            <Pressable
              style={styles.cancelButton}
              onPress={() => {
                resetFormFromUser();
                setEditingPersonal(false);
                setEditingAddress(false);
                setError('');
                setMessage('');
              }}
              disabled={saving}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      <View style={styles.actionsCard}>
        <View style={styles.actionsHeader}>
          <View style={styles.sectionIconWrap}>
            <Ionicons name="settings-outline" size={18} color={colors.accent} />
          </View>
          <View style={styles.actionsHeaderText}>
            <Text style={styles.actionsTitle}>Account Actions</Text>
            <Text style={styles.actionsSubtitle}>Manage your account</Text>
          </View>
        </View>

        {role === 'buyer' ? (
          <>
            <ActionRow
              icon="bookmark-outline"
              iconTone="accent"
              title="Saved listings"
              subtitle="View products you bookmarked"
              onPress={() => router.push('/(buyer)/saved')}
            />
            <View style={styles.actionDivider} />
          </>
        ) : null}

        <ActionRow
          icon="swap-horizontal-outline"
          iconTone="accent"
          title={switchLabel}
          subtitle={switchSubtitle}
          onPress={handleSwitchRole}
          loading={switching}
        />

        <View style={styles.actionDivider} />

        <ActionRow
          icon="log-out-outline"
          iconTone="danger"
          title="Sign Out"
          subtitle="Log out from your account"
          onPress={handleSignOut}
        />
      </View>
    </KeyboardAwareScrollView>
  );
}

function SectionCard({
  icon,
  title,
  subtitle,
  mode,
  canCancel = true,
  onEdit,
  onCancel,
  children,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  mode: 'view' | 'edit';
  canCancel?: boolean;
  onEdit: () => void;
  onCancel: () => void;
  children: ReactNode;
}) {
  return (
    <View style={[styles.sectionCard, mode === 'edit' && styles.sectionCardEditing]}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderLeft}>
          <View style={styles.sectionIconWrap}>
            <Ionicons name={icon} size={18} color={colors.accent} />
          </View>
          <View style={styles.sectionHeaderText}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <Text style={styles.sectionSubtitle}>{subtitle}</Text>
          </View>
        </View>
        {mode === 'view' ? (
          <Pressable style={styles.editLink} onPress={onEdit} hitSlop={8}>
            <Text style={styles.editLinkText}>Edit</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.accent} />
          </Pressable>
        ) : canCancel ? (
          <Pressable style={styles.cancelLink} onPress={onCancel} hitSlop={8}>
            <Text style={styles.cancelLinkText}>Cancel</Text>
          </Pressable>
        ) : null}
      </View>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function ViewField({
  label,
  value,
  muted = false,
  compact = false,
}: {
  label: string;
  value: string;
  muted?: boolean;
  compact?: boolean;
}) {
  return (
    <View style={[styles.viewField, compact && styles.viewFieldCompact]}>
      <Text style={styles.viewLabel}>{label}</Text>
      <Text style={[styles.viewValue, muted && styles.viewValueMuted]}>{value}</Text>
    </View>
  );
}

function ActionRow({
  icon,
  iconTone,
  title,
  subtitle,
  onPress,
  loading = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconTone: 'accent' | 'danger';
  title: string;
  subtitle: string;
  onPress: () => void;
  loading?: boolean;
}) {
  return (
    <Pressable style={styles.actionRow} onPress={onPress} disabled={loading}>
      <View
        style={[
          styles.actionIconWrap,
          iconTone === 'danger' ? styles.actionIconWrapDanger : styles.actionIconWrapAccent,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={colors.accent} size="small" />
        ) : (
          <Ionicons
            name={icon}
            size={18}
            color={iconTone === 'danger' ? colors.error : colors.accent}
          />
        )}
      </View>
      <View style={styles.actionText}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.muted} />
    </Pressable>
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
  pageHeader: {
    gap: 4,
    paddingTop: spacing.xs,
  },
  pageTitle: {
    color: colors.textStrong,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  pageSubtitle: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  incompleteBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: LIGHT_GREEN,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderAccent,
    padding: spacing.sm,
  },
  incompleteIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  incompleteText: {
    flex: 1,
    gap: 2,
  },
  incompleteTitle: {
    color: DARK_GREEN,
    fontSize: 14,
    fontWeight: '800',
  },
  incompleteSubtitle: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarFallback: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: LIGHT_GREEN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: DARK_GREEN,
    fontWeight: '800',
    fontSize: 22,
  },
  userInfo: {
    flex: 1,
    gap: 3,
  },
  userName: {
    color: colors.textStrong,
    fontSize: 16,
    fontWeight: '800',
  },
  userEmail: {
    color: colors.muted,
    fontSize: 13,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    backgroundColor: LIGHT_GREEN,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  roleBadgeText: {
    color: DARK_GREEN,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  completeBadge: {
    padding: 4,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
  },
  sectionCardEditing: {
    borderColor: colors.borderAccent,
    backgroundColor: '#FCFEFB',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  sectionHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  sectionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: LIGHT_GREEN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeaderText: {
    flex: 1,
    gap: 2,
  },
  sectionTitle: {
    color: colors.textStrong,
    fontSize: 16,
    fontWeight: '800',
  },
  sectionSubtitle: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
  },
  editLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingTop: 2,
  },
  editLinkText: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '700',
  },
  cancelLink: {
    paddingTop: 2,
  },
  cancelLinkText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  sectionBody: {
    gap: spacing.sm,
  },
  viewField: {
    backgroundColor: colors.bgSubtle,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  viewFieldCompact: {
    alignSelf: 'flex-start',
    minWidth: '48%',
  },
  viewLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  viewValue: {
    color: colors.textStrong,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 21,
  },
  viewValueMuted: {
    color: colors.muted,
    fontStyle: 'italic',
    fontWeight: '500',
  },
  viewRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  viewRowItem: {
    flex: 1,
  },
  field: {
    gap: 6,
  },
  label: {
    color: colors.textStrong,
    fontSize: 12,
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textStrong,
    backgroundColor: colors.surface,
  },
  pincodeInput: {
    maxWidth: '50%',
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
  saveActions: {
    gap: spacing.sm,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: DARK_GREEN,
    borderRadius: 14,
    paddingVertical: 16,
    minHeight: 52,
  },
  saveButtonText: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  cancelButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  cancelButtonText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  actionsCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  actionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  actionsHeaderText: {
    flex: 1,
    gap: 2,
  },
  actionsTitle: {
    color: colors.textStrong,
    fontSize: 16,
    fontWeight: '800',
  },
  actionsSubtitle: {
    color: colors.muted,
    fontSize: 12,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 10,
  },
  actionIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconWrapAccent: {
    backgroundColor: LIGHT_GREEN,
  },
  actionIconWrapDanger: {
    backgroundColor: 'rgba(192, 57, 43, 0.1)',
  },
  actionText: {
    flex: 1,
    gap: 2,
  },
  actionTitle: {
    color: colors.textStrong,
    fontSize: 15,
    fontWeight: '700',
  },
  actionSubtitle: {
    color: colors.muted,
    fontSize: 12,
  },
  actionDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 2,
  },
});
