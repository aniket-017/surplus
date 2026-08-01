import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Logo } from '@/src/components/Logo';
import { useAuth } from '@/src/context/AuthContext';
import {
  confirmFirebasePhoneOtp,
  sendFirebasePhoneOtp,
  type PhoneConfirmation,
} from '@/src/lib/firebaseAuth';
import { formatPhoneForDisplay, toE164Phone } from '@/src/lib/phone';
import { colors, spacing } from '@/src/constants/theme';

type AuthMode = 'signin' | 'signup';
type Step = 'phone' | 'otp';

function navigateAfterAuth(user: { role: 'buyer' | 'seller' | null }) {
  if (!user.role) {
    router.replace('/role-select');
    return;
  }

  router.replace(user.role === 'buyer' ? '/(buyer)/(tabs)' : '/(seller)/(tabs)');
}

function mapFirebaseError(error: unknown): string {
  const code =
    typeof error === 'object' && error && 'code' in error
      ? String((error as { code?: string }).code || '')
      : '';

  switch (code) {
    case 'auth/invalid-phone-number':
      return 'Enter a valid mobile number.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.';
    case 'auth/invalid-verification-code':
      return 'Invalid OTP. Please check the code and try again.';
    case 'auth/session-expired':
      return 'OTP expired. Request a new code.';
    case 'auth/missing-client-identifier':
    case 'auth/app-not-authorized':
      return 'Phone auth is not configured for this app build. Add SHA keys in Firebase and rebuild.';
    default:
      return error instanceof Error ? error.message : 'Something went wrong';
  }
}

export default function SignInScreen() {
  const { signInWithPhone, token, user } = useAuth();
  const [mode, setMode] = useState<AuthMode>('signin');
  const [step, setStep] = useState<Step>('phone');
  const [phoneInput, setPhoneInput] = useState('');
  const [e164Phone, setE164Phone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const confirmationRef = useRef<PhoneConfirmation | null>(null);

  useEffect(() => {
    if (token && user) {
      navigateAfterAuth(user);
    }
  }, [token, user]);

  async function handleSendOtp() {
    setError('');
    setInfo('');

    const normalized = toE164Phone(phoneInput);
    if (!normalized) {
      setError('Enter a valid 10-digit Indian mobile number.');
      return;
    }

    setLoading(true);

    try {
      confirmationRef.current = await sendFirebasePhoneOtp(normalized);
      setE164Phone(normalized);
      setStep('otp');
      setInfo('We sent a 6-digit code to your phone.');
    } catch (err) {
      setError(mapFirebaseError(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp() {
    setError('');
    setInfo('');

    if (!confirmationRef.current) {
      setError('Request a new OTP and try again.');
      setStep('phone');
      return;
    }

    setLoading(true);

    try {
      const idToken = await confirmFirebasePhoneOtp(confirmationRef.current, otp.trim());
      const signedInUser = await signInWithPhone(idToken, mode);
      navigateAfterAuth(signedInUser);
    } catch (err) {
      setError(mapFirebaseError(err));
    } finally {
      setLoading(false);
    }
  }

  function resetToPhoneStep() {
    setStep('phone');
    setOtp('');
    setError('');
    setInfo('');
    confirmationRef.current = null;
  }

  const isSignUp = mode === 'signup';
  const phoneReady = Boolean(toE164Phone(phoneInput));

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Logo size="lg" />

          <View style={styles.card}>
            <View style={styles.tabs}>
              <Pressable
                style={[styles.tab, mode === 'signin' && styles.tabActive]}
                onPress={() => {
                  setMode('signin');
                  resetToPhoneStep();
                }}
              >
                <Text style={[styles.tabText, mode === 'signin' && styles.tabTextActive]}>
                  Sign In
                </Text>
              </Pressable>
              <Pressable
                style={[styles.tab, mode === 'signup' && styles.tabActive]}
                onPress={() => {
                  setMode('signup');
                  resetToPhoneStep();
                }}
              >
                <Text style={[styles.tabText, mode === 'signup' && styles.tabTextActive]}>
                  Sign Up
                </Text>
              </Pressable>
            </View>

            <Text style={styles.title}>{isSignUp ? 'Create your account' : 'Welcome back'}</Text>
            <Text style={styles.subtitle}>
              {isSignUp
                ? 'Join Surplus with your mobile number to buy, sell, and recover industrial value.'
                : 'Sign in with your mobile number to continue to Surplus.'}
            </Text>

            {step === 'phone' ? (
              <View style={styles.form}>
                <Text style={styles.label}>Mobile number</Text>
                <View style={styles.phoneRow}>
                  <View style={styles.countryCode}>
                    <Text style={styles.countryCodeText}>+91</Text>
                  </View>
                  <TextInput
                    style={[styles.input, styles.phoneInput]}
                    value={phoneInput}
                    onChangeText={(value) =>
                      setPhoneInput(value.replace(/\D/g, '').slice(0, 10))
                    }
                    placeholder="98765 43210"
                    placeholderTextColor={colors.muted}
                    keyboardType="phone-pad"
                    autoComplete="tel"
                    textContentType="telephoneNumber"
                    maxLength={10}
                  />
                </View>

                {error ? <Text style={styles.error}>{error}</Text> : null}
                {info ? <Text style={styles.info}>{info}</Text> : null}

                <Pressable
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={handleSendOtp}
                  disabled={loading || !phoneReady}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.white} />
                  ) : (
                    <Text style={styles.buttonText}>
                      {isSignUp ? 'Send verification code' : 'Continue with phone'}
                    </Text>
                  )}
                </Pressable>
              </View>
            ) : (
              <View style={styles.form}>
                <Text style={styles.hint}>
                  Code sent to{' '}
                  <Text style={styles.hintStrong}>{formatPhoneForDisplay(e164Phone)}</Text>
                </Text>

                <Text style={styles.label}>Verification code</Text>
                <TextInput
                  style={[styles.input, styles.otpInput]}
                  value={otp}
                  onChangeText={(value) => setOtp(value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  placeholderTextColor={colors.muted}
                  keyboardType="number-pad"
                  maxLength={6}
                />

                {error ? <Text style={styles.error}>{error}</Text> : null}
                {info ? <Text style={styles.info}>{info}</Text> : null}

                <Pressable
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={handleVerifyOtp}
                  disabled={loading || otp.length !== 6}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.white} />
                  ) : (
                    <Text style={styles.buttonText}>
                      {isSignUp ? 'Create account' : 'Sign in'}
                    </Text>
                  )}
                </Pressable>

                <Pressable onPress={resetToPhoneStep}>
                  <Text style={styles.link}>Use a different number</Text>
                </Pressable>
              </View>
            )}

            <Text style={styles.switchText}>
              {isSignUp ? 'Already have an account? ' : 'New to Surplus? '}
              <Text
                style={styles.link}
                onPress={() => {
                  setMode(isSignUp ? 'signin' : 'signup');
                  resetToPhoneStep();
                }}
              >
                {isSignUp ? 'Sign in' : 'Create an account'}
              </Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bgSubtle,
  },
  flex: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceMuted,
    borderRadius: 8,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.surface,
  },
  tabText: {
    color: colors.muted,
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  tabTextActive: {
    color: colors.textStrong,
  },
  title: {
    color: colors.textStrong,
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  form: {
    gap: spacing.sm,
  },
  label: {
    color: colors.textStrong,
    fontWeight: '600',
    fontSize: 13,
  },
  phoneRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  countryCode: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: colors.surfaceMuted,
  },
  countryCodeText: {
    color: colors.textStrong,
    fontWeight: '700',
    fontSize: 15,
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textStrong,
    backgroundColor: colors.bg,
  },
  phoneInput: {
    flex: 1,
    letterSpacing: 1,
  },
  otpInput: {
    textAlign: 'center',
    letterSpacing: 8,
    fontSize: 22,
    fontWeight: '700',
  },
  hint: {
    color: colors.muted,
    fontSize: 14,
  },
  hintStrong: {
    color: colors.textStrong,
    fontWeight: '700',
  },
  error: {
    color: colors.error,
    fontSize: 14,
  },
  info: {
    color: colors.accentHover,
    fontSize: 14,
  },
  button: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  switchText: {
    textAlign: 'center',
    color: colors.muted,
    fontSize: 14,
  },
  link: {
    color: colors.accent,
    fontWeight: '700',
    textAlign: 'center',
  },
});
