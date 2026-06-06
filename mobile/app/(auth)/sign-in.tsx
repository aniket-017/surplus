import { router } from 'expo-router';
import { useEffect, useState } from 'react';
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
import { sendOtp } from '@/src/lib/api';
import { colors, spacing } from '@/src/constants/theme';

type AuthMode = 'signin' | 'signup';
type Step = 'email' | 'otp';

function navigateAfterAuth(user: { role: 'buyer' | 'seller' | null }) {
  if (!user.role) {
    router.replace('/role-select');
    return;
  }

  router.replace(user.role === 'buyer' ? '/(buyer)/(tabs)' : '/(seller)/(tabs)');
}

export default function SignInScreen() {
  const { signIn, token, user } = useAuth();
  const [mode, setMode] = useState<AuthMode>('signin');
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  useEffect(() => {
    if (token && user) {
      navigateAfterAuth(user);
    }
  }, [token, user]);

  async function handleSendOtp() {
    setError('');
    setInfo('');
    setLoading(true);

    try {
      await sendOtp(email.trim().toLowerCase(), mode);
      setStep('otp');
      setInfo('We sent a 6-digit code to your email.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp() {
    setError('');
    setInfo('');
    setLoading(true);

    try {
      const signedInUser = await signIn(email.trim().toLowerCase(), otp.trim(), mode);
      navigateAfterAuth(signedInUser);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  }

  const isSignUp = mode === 'signup';

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
                  setStep('email');
                  setOtp('');
                  setError('');
                  setInfo('');
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
                  setStep('email');
                  setOtp('');
                  setError('');
                  setInfo('');
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
                ? 'Join Surplus to buy, sell, and recover industrial value.'
                : 'Sign in to continue to your Surplus account.'}
            </Text>

            {step === 'email' ? (
              <View style={styles.form}>
                <Text style={styles.label}>Email address</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@company.com"
                  placeholderTextColor={colors.muted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />

                {error ? <Text style={styles.error}>{error}</Text> : null}
                {info ? <Text style={styles.info}>{info}</Text> : null}

                <Pressable
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={handleSendOtp}
                  disabled={loading || !email.trim()}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.white} />
                  ) : (
                    <Text style={styles.buttonText}>
                      {isSignUp ? 'Send verification code' : 'Continue with email'}
                    </Text>
                  )}
                </Pressable>
              </View>
            ) : (
              <View style={styles.form}>
                <Text style={styles.hint}>
                  Code sent to <Text style={styles.hintStrong}>{email}</Text>
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

                <Pressable
                  onPress={() => {
                    setStep('email');
                    setOtp('');
                    setError('');
                    setInfo('');
                  }}
                >
                  <Text style={styles.link}>Use a different email</Text>
                </Pressable>
              </View>
            )}

            <Text style={styles.switchText}>
              {isSignUp ? 'Already have an account? ' : 'New to Surplus? '}
              <Text
                style={styles.link}
                onPress={() => {
                  setMode(isSignUp ? 'signin' : 'signup');
                  setStep('email');
                  setOtp('');
                  setError('');
                  setInfo('');
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
