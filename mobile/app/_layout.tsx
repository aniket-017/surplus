import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from '@/src/context/AuthContext';
import { LocationProvider } from '@/src/context/LocationContext';
import { UnreadMessagesProvider } from '@/src/context/UnreadMessagesContext';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <UnreadMessagesProvider>
          <LocationProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="role-select" />
              <Stack.Screen name="(buyer)" />
              <Stack.Screen name="(seller)" />
            </Stack>
          </LocationProvider>
        </UnreadMessagesProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
