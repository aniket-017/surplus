import { Redirect } from 'expo-router';
import { useState } from 'react';

import { AnimatedSplash } from '@/src/components/AnimatedSplash';
import { useAuth } from '@/src/context/AuthContext';

export default function Index() {
  const { user, token, loading } = useAuth();
  const [splashDone, setSplashDone] = useState(false);

  if (loading || !splashDone) {
    return (
      <AnimatedSplash readyToExit={!loading} onFinished={() => setSplashDone(true)} />
    );
  }

  if (!token || !user) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  if (!user.name?.trim() || !user.role) {
    return <Redirect href="/onboarding" />;
  }

  if (user.role === 'buyer') {
    return <Redirect href="/(buyer)/(tabs)" />;
  }

  return <Redirect href="/(seller)/(tabs)" />;
}
