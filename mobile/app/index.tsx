import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useAuth } from '@/src/context/AuthContext';
import { colors } from '@/src/constants/theme';

export default function Index() {
  const { user, token, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (!token || !user) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  if (!user.role) {
    return <Redirect href="/role-select" />;
  }

  if (user.role === 'buyer') {
    return <Redirect href="/(buyer)/(tabs)" />;
  }

  return <Redirect href="/(seller)/(tabs)" />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgSubtle,
  },
});
