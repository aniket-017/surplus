import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Logo } from '@/src/components/Logo';
import { KeyboardAwareScrollView, ScrollIntoView } from '@/src/components/KeyboardAwareScrollView';
import { ScreenContent } from '@/src/components/ScreenContent';
import { useAuth } from '@/src/context/AuthContext';
import { formatPhoneForDisplay, toE164Phone } from '@/src/lib/phone';
import { requestPhoneNumberHintLocal } from '@/src/lib/phoneHint';
import { isExpoGo } from '@/src/lib/notifications';
import { cardShadow, colors, radius, spacing } from '@/src/constants/theme';

type Step = 'phone' | 'otp';

/** Avoid static RNFirebase imports — they crash Expo Go at module load. */
type PhoneConfirmation = {
  confirm: (code: string) => Promise<unknown>;
};

const EXPO_GO_PHONE_AUTH_MSG =
  'Phone OTP needs a native build (EAS preview/dev). Expo Go cannot load React Native Firebase.';

async function loadFirebaseAuth() {
  return import('@/src/lib/firebaseAuth');
}

function navigateAfterAuth(user: {
  name?: string | null;
  role: 'buyer' | 'seller' | null;
}) {
  if (!user.name?.trim() || !user.role) {
    router.replace('/onboarding');
    return;
  }

  router.replace(user.role === 'buyer' ? '/(buyer)/(tabs)' : '/(seller)/(tabs)');
}

function mapFirebaseError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error ?? '');
  if (
    message.includes('NativeRNFBTurboApp') ||
    message.includes('Native module') ||
    message.includes('not registered')
  ) {
    return EXPO_GO_PHONE_AUTH_MSG;
  }

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
      return message || 'Something went wrong';
  }
}

export default function SignInScreen() {
  const { signInWithPhone, token, user } = useAuth();
  const [step, setStep] = useState<Step>('phone');
  const [phoneInput, setPhoneInput] = useState('');
  const [e164Phone, setE164Phone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [hintLoading, setHintLoading] = useState(false);
  const [hintAvailable, setHintAvailable] = useState(Platform.OS === 'android');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const confirmationRef = useRef<PhoneConfirmation | null>(null);
  const hintAttemptedRef = useRef(false);
  const completingRef = useRef(false);

  useEffect(() => {
    if (token && user) {
      navigateAfterAuth(user);
    }
  }, [token, user]);

  useEffect(() => {
    if (isExpoGo()) {
      setError(EXPO_GO_PHONE_AUTH_MSG);
      setHintAvailable(false);
    }
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'android' || isExpoGo() || hintAttemptedRef.current) {
      return;
    }

    hintAttemptedRef.current = true;

    let cancelled = false;

    (async () => {
      setHintLoading(true);
      try {
        const local = await requestPhoneNumberHintLocal();
        if (!cancelled && local) {
          setPhoneInput(local);
        }
      } finally {
        if (!cancelled) {
          setHintLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const completeWithIdToken = useCallback(
    async (idToken: string) => {
      if (completingRef.current) {
        return;
      }

      completingRef.current = true;
      setLoading(true);
      setError('');
      setInfo('Verified. Signing you in…');

      try {
        const signedInUser = await signInWithPhone(idToken);
        navigateAfterAuth(signedInUser);
      } catch (err) {
        setInfo('');
        setError(mapFirebaseError(err));
        completingRef.current = false;
      } finally {
        setLoading(false);
      }
    },
    [signInWithPhone],
  );

  // Android can auto-retrieve the SMS and sign in without typing the OTP.
  useEffect(() => {
    if (step !== 'otp' || isExpoGo()) {
      return;
    }

    let unsubscribe: (() => void) | undefined;
    let cancelled = false;

    (async () => {
      try {
        const { subscribeFirebaseAuth, getCurrentFirebaseIdToken } = await loadFirebaseAuth();
        if (cancelled) {
          return;
        }

        unsubscribe = subscribeFirebaseAuth(async (signedIn) => {
          if (!signedIn || completingRef.current) {
            return;
          }

          try {
            const idToken = await getCurrentFirebaseIdToken();
            if (idToken) {
              setInfo('Code verified automatically. Signing you in…');
              await completeWithIdToken(idToken);
            }
          } catch (err) {
            setError(mapFirebaseError(err));
          }
        });
      } catch (err) {
        if (!cancelled) {
          setError(mapFirebaseError(err));
        }
      }
    })();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [step, completeWithIdToken]);

  async function handleUseMyNumber() {
    setError('');
    setHintLoading(true);

    try {
      const local = await requestPhoneNumberHintLocal();
      if (local) {
        setPhoneInput(local);
      } else {
        setInfo('No saved number found. Enter your mobile number manually.');
      }
    } catch {
      setHintAvailable(false);
    } finally {
      setHintLoading(false);
    }
  }

  async function handleSendOtp() {
    setError('');
    setInfo('');
    completingRef.current = false;

    if (isExpoGo()) {
      setError(EXPO_GO_PHONE_AUTH_MSG);
      return;
    }

    const normalized = toE164Phone(phoneInput);
    if (!normalized) {
      setError('Enter a valid 10-digit Indian mobile number.');
      return;
    }

    setLoading(true);

    try {
      const { sendFirebasePhoneOtp, getCurrentFirebaseIdToken } = await loadFirebaseAuth();
      confirmationRef.current = await sendFirebasePhoneOtp(normalized);
      setE164Phone(normalized);
      setStep('otp');
      setInfo('We sent a 6-digit code to your phone.');

      const existingToken = await getCurrentFirebaseIdToken();
      if (existingToken) {
        setInfo('Code verified automatically. Signing you in…');
        await completeWithIdToken(existingToken);
      }
    } catch (err) {
      setError(mapFirebaseError(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(codeOverride?: string) {
    const code = (codeOverride ?? otp).trim();
    setError('');
    setInfo('');

    if (isExpoGo()) {
      setError(EXPO_GO_PHONE_AUTH_MSG);
      return;
    }

    try {
      const {
        confirmFirebasePhoneOtp,
        getCurrentFirebaseIdToken,
      } = await loadFirebaseAuth();

      if (!confirmationRef.current) {
        const existingToken = await getCurrentFirebaseIdToken();
        if (existingToken) {
          await completeWithIdToken(existingToken);
          return;
        }

        setError('Request a new OTP and try again.');
        setStep('phone');
        return;
      }

      if (!/^\d{6}$/.test(code)) {
        setError('Enter the 6-digit verification code.');
        return;
      }

      setLoading(true);

      try {
        const idToken = await confirmFirebasePhoneOtp(confirmationRef.current, code);
        await completeWithIdToken(idToken);
      } catch (err) {
        try {
          const existingToken = await getCurrentFirebaseIdToken();
          if (existingToken) {
            await completeWithIdToken(existingToken);
            return;
          }
        } catch {
          // Fall through to original error.
        }
        setError(mapFirebaseError(err));
      } finally {
        setLoading(false);
      }
    } catch (err) {
      setError(mapFirebaseError(err));
    }
  }

  function resetToPhoneStep() {
    setStep('phone');
    setOtp('');
    setError('');
    setInfo('');
    confirmationRef.current = null;
    completingRef.current = false;
  }

  const phoneReady = Boolean(toE164Phone(phoneInput));

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAwareScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <ScreenContent style={styles.screenContent}>
          <View style={styles.brand}>
            <Logo size="lg" />
          </View>

          <View style={styles.card}>
            <View style={styles.header}>
              <Text style={styles.title}>
                {step === 'phone' ? 'Welcome to Surplus' : 'Enter verification code'}
              </Text>
              <Text style={styles.subtitle}>
                {step === 'phone'
                  ? 'Enter your mobile number to continue. We’ll send a one-time code to verify it’s you.'
                  : `Code sent to ${formatPhoneForDisplay(e164Phone)}`}
              </Text>
            </View>

            {step === 'phone' ? (
              <View style={styles.form}>
                <Text style={styles.label}>Mobile number</Text>
                <ScrollIntoView>
                  <View style={styles.phoneField}>
                    <Text style={styles.countryCodeText}>+91</Text>
                    <View style={styles.phoneDivider} />
                    <TextInput
                      style={styles.phoneInput}
                      value={phoneInput}
                      onChangeText={(value) => setPhoneInput(value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="98765 43210"
                      placeholderTextColor={colors.muted}
                      keyboardType="phone-pad"
                      autoComplete="tel"
                      textContentType="telephoneNumber"
                      maxLength={10}
                    />
                  </View>
                </ScrollIntoView>

                {hintAvailable ? (
                  <Pressable
                    onPress={handleUseMyNumber}
                    disabled={hintLoading || loading}
                    style={styles.hintLinkWrap}
                  >
                    {hintLoading ? (
                      <ActivityIndicator color={colors.accent} size="small" />
                    ) : (
                      <Text style={styles.link}>Use my number</Text>
                    )}
                  </Pressable>
                ) : null}

                {error ? <Text style={styles.error}>{error}</Text> : null}
                {info ? <Text style={styles.info}>{info}</Text> : null}

                <Pressable
                  style={({ pressed }) => [
                    styles.button,
                    pressed && styles.buttonPressed,
                    (loading || !phoneReady) && styles.buttonDisabled,
                  ]}
                  onPress={handleSendOtp}
                  disabled={loading || !phoneReady}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.white} />
                  ) : (
                    <Text style={styles.buttonText}>Send verification code</Text>
                  )}
                </Pressable>
              </View>
            ) : (
              <View style={styles.form}>
                <Text style={styles.label}>Verification code</Text>
                <ScrollIntoView>
                  <TextInput
                    style={styles.otpInput}
                    value={otp}
                    onChangeText={(value) => {
                      const digits = value.replace(/\D/g, '').slice(0, 6);
                      setOtp(digits);
                      if (digits.length === 6 && !loading && !completingRef.current) {
                        void handleVerifyOtp(digits);
                      }
                    }}
                    placeholder="000000"
                    placeholderTextColor={colors.muted}
                    keyboardType="number-pad"
                    maxLength={6}
                    autoComplete="sms-otp"
                    textContentType="oneTimeCode"
                    importantForAutofill="yes"
                    autoFocus
                  />
                </ScrollIntoView>

                {error ? <Text style={styles.error}>{error}</Text> : null}
                {info ? <Text style={styles.info}>{info}</Text> : null}

                <Pressable
                  style={({ pressed }) => [
                    styles.button,
                    pressed && styles.buttonPressed,
                    (loading || otp.length !== 6) && styles.buttonDisabled,
                  ]}
                  onPress={() => void handleVerifyOtp()}
                  disabled={loading || otp.length !== 6}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.white} />
                  ) : (
                    <Text style={styles.buttonText}>Continue</Text>
                  )}
                </Pressable>

                <Pressable onPress={resetToPhoneStep} style={styles.secondaryLinkWrap}>
                  <Text style={styles.link}>Use a different number</Text>
                </Pressable>
              </View>
            )}
          </View>
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
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  screenContent: {
    gap: spacing.xl,
  },
  brand: {
    alignItems: 'center',
    paddingTop: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
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
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
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
  phoneField: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.sm,
    minHeight: 52,
  },
  countryCodeText: {
    color: colors.textStrong,
    fontWeight: '700',
    fontSize: 16,
    paddingHorizontal: spacing.xs,
  },
  phoneDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
    marginHorizontal: spacing.xs,
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    color: colors.textStrong,
    letterSpacing: 1,
    paddingVertical: 14,
    paddingHorizontal: spacing.xs,
  },
  otpInput: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.bg,
    textAlign: 'center',
    letterSpacing: 10,
    fontSize: 24,
    fontWeight: '700',
    color: colors.textStrong,
    paddingVertical: 16,
    minHeight: 56,
  },
  hintLinkWrap: {
    alignSelf: 'flex-start',
    minHeight: 28,
    justifyContent: 'center',
    paddingVertical: 2,
  },
  secondaryLinkWrap: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  error: {
    color: colors.error,
    fontSize: 14,
    lineHeight: 20,
  },
  info: {
    color: colors.accentHover,
    fontSize: 14,
    lineHeight: 20,
  },
  button: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: 'center',
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
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.2,
  },
  link: {
    color: colors.accent,
    fontWeight: '600',
    fontSize: 14,
  },
});
