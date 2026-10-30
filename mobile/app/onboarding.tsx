import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { KeyboardAwareScrollView, ScrollIntoView } from '@/src/components/KeyboardAwareScrollView';
import { ScreenContent } from '@/src/components/ScreenContent';
import { IconInput } from '@/src/components/onboarding/IconInput';
import { OnboardingHeader } from '@/src/components/onboarding/OnboardingHeader';
import { RoleCard } from '@/src/components/onboarding/RoleCard';
import { useAuth } from '@/src/context/AuthContext';
import { cardShadow, colors, fonts, radius, spacing } from '@/src/constants/theme';
import type { UserRole } from '@/src/types/auth';

const LANDSCAPE = require('@/assets/images/onboarding/landscape.jpg');
const SELL_IMAGE = require('@/assets/images/onboarding/sell-cnc.png');
const BUY_IMAGE = require('@/assets/images/onboarding/buy-forklift.png');

const STEP_LABELS = ['Your Details', 'Choose Role'];

type Step = 'profile' | 'role';

function hasName(name?: string | null) {
  return Boolean(name?.trim());
}

function tabsForRole(role: UserRole) {
  return role === 'buyer' ? '/(buyer)/(tabs)' : '/(seller)/(tabs)';
}

export default function OnboardingScreen() {
  const { user, token, updateProfile, setRole, signOut } = useAuth();

  const needsName = !hasName(user?.name);
  const needsRole = !user?.role;

  const initialStep: Step = needsName ? 'profile' : 'role';
  const [step, setStep] = useState<Step>(initialStep);
  // Captured once so the step count doesn't change after the name is saved.
  const [isTwoStep] = useState(needsName && needsRole);
  const [name, setName] = useState(user?.name?.trim() ?? '');
  const [email, setEmail] = useState(user?.email?.trim() ?? '');
  const [referralCode, setReferralCode] = useState('');
  const [referralOpen, setReferralOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('seller');
  const [savingProfile, setSavingProfile] = useState(false);
  const [loadingRole, setLoadingRole] = useState<UserRole | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState('');

  if (!token || !user) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  if (!needsName && !needsRole && user.role) {
    return <Redirect href={tabsForRole(user.role)} />;
  }

  const stepIndex = isTwoStep && step === 'role' ? 1 : 0;
  const stepLabel = `Step ${stepIndex + 1} of ${isTwoStep ? 2 : 1}`;
  const busy = savingProfile || !!loadingRole || signingOut;

  async function handleBack() {
    if (busy) return;
    setError('');

    if (step === 'role') {
      setStep('profile');
      return;
    }

    setSigningOut(true);
    try {
      await signOut();
      router.replace('/(auth)/sign-in');
    } finally {
      setSigningOut(false);
    }
  }

  async function handleContinueProfile() {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Please enter your name to continue.');
      return;
    }

    const trimmedEmail = email.trim();
    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Enter a valid email address, or leave it blank.');
      return;
    }

    setSavingProfile(true);
    setError('');

    try {
      const trimmedReferral = referralCode.trim();
      const updated = await updateProfile({
        name: trimmedName,
        ...(trimmedEmail ? { email: trimmedEmail } : {}),
        ...(trimmedReferral ? { referralCode: trimmedReferral } : {}),
      });

      if (updated.role) {
        router.replace(tabsForRole(updated.role));
        return;
      }

      setStep('role');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save your profile');
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleSelectRole(role: UserRole) {
    if (loadingRole) return;

    setLoadingRole(role);
    setError('');

    try {
      await setRole(role);
      router.replace(tabsForRole(role));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set role');
    } finally {
      setLoadingRole(null);
    }
  }

  const canGoBack = step === 'profile' || isTwoStep;

  return (
    <View style={styles.root}>
      {step === 'profile' ? (
        <View style={styles.landscape} pointerEvents="none">
          <Image source={LANDSCAPE} style={styles.landscapeImage} contentFit="cover" />
          <LinearGradient
            colors={[colors.bgSubtle, 'rgba(244, 247, 250, 0)']}
            style={styles.landscapeFade}
          />
        </View>
      ) : null}

      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <KeyboardAwareScrollView
          contentContainerStyle={[
            styles.scrollContent,
            step === 'profile' && styles.scrollContentProfile,
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <ScreenContent style={styles.container}>
            <OnboardingHeader
              stepLabel={stepLabel}
              onBack={canGoBack ? handleBack : undefined}
              backDisabled={busy}
              stepper={isTwoStep ? { current: stepIndex, labels: STEP_LABELS } : undefined}
            />

            {step === 'profile' ? (
              <View style={styles.panel}>
                <View style={styles.header}>
                  <Text style={styles.title}>Let's get to know you</Text>
                  <Text style={styles.subtitle}>
                    Create your account to start buying and selling on Surplus.
                  </Text>
                </View>

                <View style={styles.form}>
                  <View style={styles.field}>
                    <Text style={styles.label}>
                      Your full name <Text style={styles.required}>*</Text>
                    </Text>
                    <ScrollIntoView>
                      <IconInput
                        icon="person-outline"
                        value={name}
                        onChangeText={setName}
                        placeholder="e.g. Priya Sharma"
                        autoCapitalize="words"
                        autoCorrect={false}
                        returnKeyType="next"
                        editable={!savingProfile}
                      />
                    </ScrollIntoView>
                  </View>

                  <View style={styles.field}>
                    <Text style={styles.label}>
                      Work email address <Text style={styles.optional}>(Optional)</Text>
                    </Text>
                    <ScrollIntoView>
                      <IconInput
                        icon="mail-outline"
                        value={email}
                        onChangeText={setEmail}
                        placeholder="you@company.com"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        returnKeyType={referralOpen ? 'next' : 'done'}
                        onSubmitEditing={referralOpen ? undefined : handleContinueProfile}
                        editable={!savingProfile}
                      />
                    </ScrollIntoView>
                  </View>

                  <View style={styles.referral}>
                    <Pressable
                      onPress={() => setReferralOpen((open) => !open)}
                      accessibilityRole="button"
                      accessibilityState={{ expanded: referralOpen }}
                      style={({ pressed }) => [
                        styles.referralToggle,
                        pressed && styles.referralTogglePressed,
                      ]}
                    >
                      <Ionicons name="pricetag-outline" size={18} color={colors.accentHover} />
                      <Text style={styles.referralText}>Have a referral code?</Text>
                      <Ionicons
                        name="chevron-down"
                        size={18}
                        color={colors.accentHover}
                        style={referralOpen && styles.chevronOpen}
                      />
                    </Pressable>

                    {referralOpen ? (
                      <ScrollIntoView style={styles.referralInput}>
                        <IconInput
                          icon="pricetag-outline"
                          value={referralCode}
                          onChangeText={(value) => setReferralCode(value.toUpperCase())}
                          placeholder="e.g. PARTNER2026"
                          autoCapitalize="characters"
                          autoCorrect={false}
                          autoFocus
                          returnKeyType="done"
                          onSubmitEditing={handleContinueProfile}
                          editable={!savingProfile}
                          maxLength={32}
                        />
                      </ScrollIntoView>
                    ) : null}
                  </View>
                </View>

                {error ? <Text style={styles.error}>{error}</Text> : null}

                <Pressable
                  style={({ pressed }) => [
                    styles.button,
                    pressed && styles.buttonPressed,
                    savingProfile && styles.buttonDisabled,
                  ]}
                  onPress={handleContinueProfile}
                  disabled={savingProfile}
                >
                  {savingProfile ? (
                    <ActivityIndicator color={colors.white} />
                  ) : (
                    <>
                      <Text style={styles.buttonText}>Continue</Text>
                      <Ionicons name="arrow-forward" size={20} color={colors.white} />
                    </>
                  )}
                </Pressable>

                <View style={styles.note}>
                  <Ionicons name="shield-checkmark-outline" size={16} color={colors.muted} />
                  <Text style={styles.noteText}>Your information is safe and secure.</Text>
                </View>
              </View>
            ) : (
              <View style={styles.roleSection}>
                <View style={styles.header}>
                  <Text style={styles.title}>How do you want to start?</Text>
                  <Text style={styles.subtitle}>
                    Choose your primary role. You can always switch or use both later.
                  </Text>
                </View>

                <RoleCard
                  title="I want to Sell"
                  description="List and sell your surplus equipment, machinery or materials."
                  bullets={['Create product listings', 'Reach genuine buyers', 'Get better value']}
                  image={SELL_IMAGE}
                  badgeIcon="pricetag"
                  selected={selectedRole === 'seller'}
                  onPress={() => setSelectedRole('seller')}
                  disabled={!!loadingRole}
                />

                <RoleCard
                  title="I want to Buy"
                  description="Browse and buy quality pre-owned equipment at great prices."
                  bullets={[
                    'Discover verified listings',
                    'Connect with sellers',
                    'Save on equipment cost',
                  ]}
                  image={BUY_IMAGE}
                  selected={selectedRole === 'buyer'}
                  onPress={() => setSelectedRole('buyer')}
                  disabled={!!loadingRole}
                />

                {error ? <Text style={styles.error}>{error}</Text> : null}

                <Pressable
                  style={({ pressed }) => [
                    styles.button,
                    styles.roleButton,
                    pressed && styles.buttonPressed,
                    !!loadingRole && styles.buttonDisabled,
                  ]}
                  onPress={() => handleSelectRole(selectedRole)}
                  disabled={!!loadingRole}
                >
                  {loadingRole ? (
                    <ActivityIndicator color={colors.white} />
                  ) : (
                    <>
                      <Text style={styles.buttonText}>Create My Account</Text>
                      <Ionicons name="arrow-forward" size={20} color={colors.white} />
                    </>
                  )}
                </Pressable>

                <View style={styles.note}>
                  <Ionicons name="shuffle-outline" size={18} color={colors.muted} />
                  <Text style={styles.noteText}>
                    You can always switch roles or use both later from your profile settings.
                  </Text>
                </View>

                {isTwoStep ? (
                  <View style={styles.dots}>
                    <View style={styles.dot} />
                    <View style={[styles.dot, styles.dotActive]} />
                  </View>
                ) : null}
              </View>
            )}
          </ScreenContent>
        </KeyboardAwareScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgSubtle,
  },
  safeArea: {
    flex: 1,
  },
  landscape: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  landscapeImage: {
    width: '100%',
    aspectRatio: 1024 / 379,
  },
  landscapeFade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '45%',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
  scrollContentProfile: {
    paddingBottom: 120,
  },
  container: {
    gap: spacing.lg,
  },
  panel: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: spacing.lg,
    gap: spacing.lg,
    ...cardShadow,
  },
  header: {
    gap: spacing.xs,
  },
  title: {
    color: colors.textStrong,
    fontFamily: fonts.extrabold,
    fontSize: 28,
    letterSpacing: -0.4,
  },
  subtitle: {
    color: colors.muted,
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
  },
  form: {
    gap: spacing.md,
  },
  field: {
    gap: spacing.xs,
  },
  label: {
    color: colors.textStrong,
    fontFamily: fonts.semibold,
    fontSize: 14,
  },
  required: {
    color: colors.error,
  },
  optional: {
    color: colors.muted,
    fontFamily: fonts.regular,
    fontSize: 13,
  },
  referral: {
    borderRadius: radius.md,
    backgroundColor: 'rgba(92, 179, 53, 0.1)',
    overflow: 'hidden',
  },
  referralToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: spacing.md,
    minHeight: 52,
  },
  referralTogglePressed: {
    opacity: 0.7,
  },
  referralText: {
    flex: 1,
    color: colors.accentHover,
    fontFamily: fonts.semibold,
    fontSize: 15,
  },
  chevronOpen: {
    transform: [{ rotate: '180deg' }],
  },
  referralInput: {
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    minHeight: 56,
    backgroundColor: colors.accent,
    borderRadius: radius.md,
  },
  roleButton: {
    marginTop: spacing.xs,
  },
  buttonPressed: {
    backgroundColor: colors.accentHover,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  buttonText: {
    color: colors.white,
    fontFamily: fonts.bold,
    fontSize: 17,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: -spacing.xs,
    paddingHorizontal: spacing.md,
  },
  noteText: {
    flexShrink: 1,
    color: colors.muted,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
  },
  roleSection: {
    gap: spacing.md,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: spacing.sm,
  },
  dot: {
    width: 22,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(15, 27, 45, 0.12)',
  },
  dotActive: {
    backgroundColor: colors.accent,
  },
  error: {
    color: colors.error,
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});
