import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInRight,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OtpBoxes } from '@/src/components/auth/OtpBoxes';
import { PhoneField } from '@/src/components/auth/PhoneField';
import { PrimaryButton } from '@/src/components/auth/PrimaryButton';
import { PulseDot } from '@/src/components/auth/PulseDot';
import { Shake } from '@/src/components/auth/Shake';
import { IndustrialMosaic } from '@/src/components/IndustrialMosaic';
import { Logo } from '@/src/components/Logo';
import { KeyboardAwareScrollView, ScrollIntoView } from '@/src/components/KeyboardAwareScrollView';
import { ScreenContent } from '@/src/components/ScreenContent';
import { useAuth } from '@/src/context/AuthContext';
import { resendPhoneOtp, sendPhoneOtp } from '@/src/lib/api';
import { formatPhoneForDisplay, toE164Phone, toIndianLocalDigits } from '@/src/lib/phone';
import { requestPhoneNumberHintLocal } from '@/src/lib/phoneHint';
import { isExpoGo } from '@/src/lib/notifications';
import { colors, radius, spacing } from '@/src/constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
/** Leaves room below for the logo, headline and form without scrolling. */
const MOSAIC_HEIGHT = Math.min(520, Math.max(400, SCREEN_HEIGHT * 0.5));

type Step = 'phone' | 'otp';

const RESEND_COOLDOWN_SECONDS = 30;
const OTP_LENGTH = 4;

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

function errorMessage(error: unknown): string {
  return error instanceof Error && error.message ? error.message : 'Something went wrong';
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
  const [resendIn, setResendIn] = useState(0);
  const [resending, setResending] = useState(false);
  const hintAttemptedRef = useRef(false);
  const completingRef = useRef(false);
  const introDoneRef = useRef(false);

  useEffect(() => {
    if (token && user) {
      navigateAfterAuth(user);
    }
  }, [token, user]);

  useEffect(() => {
    if (isExpoGo()) {
      setHintAvailable(false);
    }
  }, []);

  useEffect(() => {
    if (resendIn <= 0) {
      return;
    }
    const timer = setTimeout(() => setResendIn((seconds) => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

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

    const normalized = toE164Phone(phoneInput);
    if (!normalized) {
      setError('Enter a valid 10-digit Indian mobile number.');
      return;
    }

    setLoading(true);

    try {
      await sendPhoneOtp(normalized);
      setE164Phone(normalized);
      setOtp('');
      setStep('otp');
      setResendIn(RESEND_COOLDOWN_SECONDS);
      setInfo(`We sent a ${OTP_LENGTH}-digit code to your phone.`);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleResendOtp() {
    if (resendIn > 0 || resending || loading || !e164Phone) {
      return;
    }

    setError('');
    setInfo('');
    setResending(true);

    try {
      await resendPhoneOtp(e164Phone);
      setOtp('');
      setResendIn(RESEND_COOLDOWN_SECONDS);
      setInfo('We sent a new code to your phone.');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setResending(false);
    }
  }

  async function handleVerifyOtp(codeOverride?: string) {
    const code = (codeOverride ?? otp).trim();
    setError('');
    setInfo('');

    if (code.length !== OTP_LENGTH || !/^\d+$/.test(code)) {
      setError(`Enter the ${OTP_LENGTH}-digit verification code.`);
      return;
    }

    if (completingRef.current) {
      return;
    }

    completingRef.current = true;
    setLoading(true);
    setInfo('Verifying…');

    try {
      const signedInUser = await signInWithPhone(e164Phone, code);
      setInfo('Verified. Signing you in…');
      navigateAfterAuth(signedInUser);
    } catch (err) {
      setInfo('');
      setError(errorMessage(err));
      completingRef.current = false;
    } finally {
      setLoading(false);
    }
  }

  function resetToPhoneStep() {
    setStep('phone');
    setOtp('');
    setError('');
    setInfo('');
    setResendIn(0);
    completingRef.current = false;
  }

  const phoneReady = Boolean(toE164Phone(phoneInput));
  if (step === 'otp') {
    introDoneRef.current = true;
  }
  const introDone = introDoneRef.current;

  const messages = (
    <>
      {error ? (
        <Shake trigger={error}>
          <Animated.View entering={FadeIn.duration(200)} style={[styles.notice, styles.noticeError]}>
            <Text style={styles.noticeErrorText}>{error}</Text>
          </Animated.View>
        </Shake>
      ) : null}
      {info ? (
        <Animated.View entering={FadeIn.duration(200)} style={[styles.notice, styles.noticeInfo]}>
          <PulseDot />
          <Text style={styles.noticeInfoText}>{info}</Text>
        </Animated.View>
      ) : null}
    </>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
      <KeyboardAwareScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <IndustrialMosaic height={MOSAIC_HEIGHT} width={SCREEN_WIDTH} />

        <View style={styles.sheet}>
          <ScreenContent style={styles.screenContent}>
            <View style={styles.sheetSpacer} />

            <View style={styles.brand}>
              <Animated.View
                entering={ZoomIn.delay(250).springify().damping(14)}
                style={styles.logoWrap}
              >
                <BreathingGlow />
                <Logo size="xl" />
              </Animated.View>
            </View>

            {step === 'phone' ? (
              <View key="phone">
                <Animated.View
                  entering={FadeInDown.delay(introDone ? 0 : 520).duration(500)}
                  style={styles.header}
                >
                  <Text style={styles.title}>
                    Industrial surplus,{'\n'}
                    <Text style={styles.titleAccent}>traded smarter.</Text>
                  </Text>
                </Animated.View>

                <Animated.View
                  entering={FadeInDown.delay(introDone ? 80 : 640).duration(500)}
                  style={styles.form}
                >
                  <ScrollIntoView>
                    <PhoneField
                      value={phoneInput}
                      valid={phoneReady}
                      onChangeText={(value) => {
                        const autofilled = toIndianLocalDigits(value);
                        setPhoneInput(autofilled ?? value.replace(/\D/g, '').slice(0, 10));
                      }}
                    />
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

                  {messages}

                  <PrimaryButton
                    label="Continue"
                    onPress={handleSendOtp}
                    disabled={!phoneReady}
                    loading={loading}
                  />
                </Animated.View>
              </View>
            ) : (
              <Animated.View key="otp" entering={FadeInRight.duration(400)}>
                <View style={styles.header}>
                  <Text style={styles.title}>Verify your number</Text>
                  <View style={styles.subtitleRow}>
                    <Text style={styles.subtitle}>Code sent to </Text>
                    <Text style={styles.subtitleStrong}>{formatPhoneForDisplay(e164Phone)}</Text>
                  </View>
                </View>

                <View style={styles.form}>
                  <ScrollIntoView>
                    <OtpBoxes
                      value={otp}
                      length={OTP_LENGTH}
                      onChangeText={(value) => {
                        const digits = value.replace(/\D/g, '').slice(0, OTP_LENGTH);
                        setOtp(digits);
                        if (digits.length === OTP_LENGTH && !loading && !completingRef.current) {
                          void handleVerifyOtp(digits);
                        }
                      }}
                    />
                  </ScrollIntoView>

                  {messages}

                  <PrimaryButton
                    label="Verify & continue"
                    onPress={() => void handleVerifyOtp()}
                    disabled={otp.length !== OTP_LENGTH}
                    loading={loading}
                  />

                  <Pressable
                    onPress={() => void handleResendOtp()}
                    disabled={resendIn > 0 || resending || loading}
                    style={styles.secondaryLinkWrap}
                  >
                    {resending ? (
                      <ActivityIndicator color={colors.accent} size="small" />
                    ) : (
                      <Text style={resendIn > 0 ? styles.secondaryLink : styles.link}>
                        {resendIn > 0 ? `Resend code in ${resendIn}s` : 'Resend code'}
                      </Text>
                    )}
                  </Pressable>

                  <Pressable onPress={resetToPhoneStep} style={styles.secondaryLinkWrap}>
                    <Text style={styles.secondaryLink}>← Use a different number</Text>
                  </Pressable>
                </View>
              </Animated.View>
            )}

            <Animated.Text entering={FadeIn.delay(800).duration(500)} style={styles.legal}>
              By continuing, you agree to our{' '}
              <Text style={styles.legalStrong}>Terms of Service</Text> &{' '}
              <Text style={styles.legalStrong}>Privacy Policy</Text>
            </Animated.Text>
          </ScreenContent>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

function BreathingGlow() {
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withRepeat(
      withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [t]);

  const style = useAnimatedStyle(() => ({
    opacity: 0.35 + t.value * 0.4,
    transform: [{ scale: 0.92 + t.value * 0.12 }],
  }));

  return (
    <Animated.View pointerEvents="none" style={[styles.logoGlow, style]}>
      {[1, 0.8, 0.6, 0.4].map((scale) => (
        <View
          key={scale}
          style={[styles.logoGlowLayer, { width: 360 * scale, height: 170 * scale }]}
        />
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scroll: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    minHeight: SCREEN_HEIGHT,
    backgroundColor: colors.surface,
  },
  sheet: {
    flex: 1,
    // Transparent so the mosaic fade shows through — no hard white cut line.
    backgroundColor: 'transparent',
    marginTop: -100,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  screenContent: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  brand: {
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  logoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoGlow: {
    position: 'absolute',
    width: 360,
    height: 170,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoGlowLayer: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(92, 179, 53, 0.05)',
  },
  sheetSpacer: {
    flexGrow: 1,
    minHeight: spacing.md,
  },
  header: {
    gap: 6,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    color: colors.textStrong,
    fontSize: 21,
    lineHeight: 27,
    fontWeight: '800',
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  titleAccent: {
    color: colors.accent,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 20,
  },
  subtitleStrong: {
    color: colors.textStrong,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
  },
  form: {
    gap: spacing.sm,
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
  secondaryLink: {
    color: colors.muted,
    fontWeight: '600',
    fontSize: 14,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  noticeError: {
    backgroundColor: '#FDF1EF',
    borderColor: 'rgba(192, 57, 43, 0.2)',
  },
  noticeErrorText: {
    flex: 1,
    color: colors.error,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  noticeInfo: {
    backgroundColor: '#F1F8EC',
    borderColor: colors.borderAccent,
  },
  noticeInfoText: {
    flex: 1,
    color: colors.accentHover,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  link: {
    color: colors.accent,
    fontWeight: '700',
    fontSize: 14,
  },
  legal: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  legalStrong: {
    color: colors.textStrong,
    fontWeight: '700',
  },
});
