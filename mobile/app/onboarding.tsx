import { Redirect, router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { KeyboardAwareScrollView } from '@/src/components/KeyboardAwareScrollView';
import { Logo } from '@/src/components/Logo';
import { ScreenContent } from '@/src/components/ScreenContent';
import { useAuth } from '@/src/context/AuthContext';
import { cardShadow, colors, radius, spacing } from '@/src/constants/theme';
import type { UserRole } from '@/src/types/auth';

type Step = 'profile' | 'role';

function hasName(name?: string | null) {
  return Boolean(name?.trim());
}

function tabsForRole(role: UserRole) {
  return role === 'buyer' ? '/(buyer)/(tabs)' : '/(seller)/(tabs)';
}

export default function OnboardingScreen() {
  const { user, token, updateProfile, setRole } = useAuth();

  const needsName = !hasName(user?.name);
  const needsRole = !user?.role;

  const initialStep: Step = needsName ? 'profile' : 'role';
  const [step, setStep] = useState<Step>(initialStep);
  const [name, setName] = useState(user?.name?.trim() ?? '');
  const [email, setEmail] = useState(user?.email?.trim() ?? '');
  const [referralCode, setReferralCode] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [loadingRole, setLoadingRole] = useState<UserRole | null>(null);
  const [error, setError] = useState('');

  const stepLabel = useMemo(() => {
    if (!needsName) return 'Step 1 of 1';
    if (!needsRole) return 'Step 1 of 1';
    return step === 'profile' ? 'Step 1 of 2' : 'Step 2 of 2';
  }, [needsName, needsRole, step]);

  if (!token || !user) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  if (!needsName && !needsRole && user.role) {
    return <Redirect href={tabsForRole(user.role)} />;
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAwareScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <ScreenContent style={styles.container}>
          <View style={styles.brand}>
            <Logo size="lg" />
          </View>

          <Text style={styles.stepBadge}>{stepLabel}</Text>

          {step === 'profile' ? (
            <View style={styles.panel}>
              <View style={styles.header}>
                <Text style={styles.title}>What's your name?</Text>
                <Text style={styles.subtitle}>
                  Tell us a bit about you so we can personalize your Surplus experience.
                </Text>
              </View>

              <View style={styles.form}>
                <Text style={styles.label}>Full name</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Priya Sharma"
                  placeholderTextColor={colors.muted}
                  autoCapitalize="words"
                  autoCorrect={false}
                  returnKeyType="next"
                  editable={!savingProfile}
                />

                <Text style={styles.label}>Email (optional)</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@company.com"
                  placeholderTextColor={colors.muted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  editable={!savingProfile}
                />

                <Text style={styles.label}>Referral code (optional)</Text>
                <TextInput
                  style={styles.input}
                  value={referralCode}
                  onChangeText={(value) => setReferralCode(value.toUpperCase())}
                  placeholder="e.g. PARTNER2026"
                  placeholderTextColor={colors.muted}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={handleContinueProfile}
                  editable={!savingProfile}
                  maxLength={32}
                />
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
                  <Text style={styles.buttonText}>Continue</Text>
                )}
              </Pressable>
            </View>
          ) : (
            <View style={styles.roleSection}>
              <View style={styles.header}>
                <Text style={[styles.title, styles.titleCenter]}>How will you use Surplus?</Text>
                <Text style={[styles.subtitle, styles.subtitleCenter]}>
                  Choose your role to get started. You can switch anytime from your profile.
                </Text>
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.roleCard,
                  pressed && styles.roleCardPressed,
                  loadingRole === 'buyer' && styles.roleCardActive,
                ]}
                onPress={() => handleSelectRole('buyer')}
                disabled={!!loadingRole}
              >
                <Text style={styles.roleBadge}>Buyer</Text>
                <Text style={styles.roleTitle}>Become a Buyer</Text>
                <Text style={styles.roleText}>
                  Browse surplus inventory, place orders, and recover value for your business.
                </Text>
                {loadingRole === 'buyer' ? (
                  <ActivityIndicator color={colors.accent} style={styles.roleLoader} />
                ) : null}
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.roleCard,
                  pressed && styles.roleCardPressed,
                  loadingRole === 'seller' && styles.roleCardActive,
                ]}
                onPress={() => handleSelectRole('seller')}
                disabled={!!loadingRole}
              >
                <Text style={styles.roleBadge}>Seller</Text>
                <Text style={styles.roleTitle}>Become a Seller</Text>
                <Text style={styles.roleText}>
                  List surplus stock, manage listings, and connect with industrial buyers.
                </Text>
                {loadingRole === 'seller' ? (
                  <ActivityIndicator color={colors.accent} style={styles.roleLoader} />
                ) : null}
              </Pressable>

              {error ? <Text style={styles.error}>{error}</Text> : null}
            </View>
          )}
        </ScreenContent>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bgSubtle,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  container: {
    gap: spacing.md,
  },
  brand: {
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  stepBadge: {
    alignSelf: 'center',
    backgroundColor: 'rgba(92, 179, 53, 0.12)',
    color: colors.accentHover,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  panel: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
    gap: spacing.lg,
    ...cardShadow,
  },
  header: {
    gap: spacing.xs,
  },
  title: {
    color: colors.textStrong,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  titleCenter: {
    textAlign: 'center',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  subtitleCenter: {
    textAlign: 'center',
  },
  form: {
    gap: spacing.sm,
  },
  label: {
    color: colors.muted,
    fontWeight: '600',
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.bg,
    fontSize: 16,
    color: colors.textStrong,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    minHeight: 52,
    marginBottom: spacing.xs,
  },
  button: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonPressed: {
    backgroundColor: colors.accentHover,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  buttonText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.2,
  },
  roleSection: {
    gap: spacing.md,
  },
  roleCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
    gap: spacing.sm,
    ...cardShadow,
  },
  roleCardPressed: {
    borderColor: colors.borderAccent,
    backgroundColor: colors.surfaceMuted,
    opacity: 0.96,
  },
  roleCardActive: {
    borderColor: colors.borderAccent,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(92, 179, 53, 0.12)',
    color: colors.accentHover,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  roleTitle: {
    color: colors.textStrong,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  roleText: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  roleLoader: {
    marginTop: spacing.xs,
    alignSelf: 'flex-start',
  },
  error: {
    color: colors.error,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});
