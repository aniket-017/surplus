import { Redirect } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { IntroVideo } from '@/src/components/IntroVideo';
import { colors } from '@/src/constants/theme';
import { useAuth } from '@/src/context/AuthContext';

export default function Index() {
  const { user, token, loading } = useAuth();
  const [introDone, setIntroDone] = useState(false);

  if (!introDone) {
    return <IntroVideo onFinished={() => setIntroDone(true)} />;
  }

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.accent} />
      </View>
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

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
