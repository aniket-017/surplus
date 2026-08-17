import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { AppUpdateModal } from '@/src/components/AppUpdateModal';
import { AuthProvider } from '@/src/context/AuthContext';
import { AdminNotificationsProvider } from '@/src/context/AdminNotificationsContext';
import { LocationProvider } from '@/src/context/LocationContext';
import { RoleSwitchProvider } from '@/src/context/RoleSwitchContext';
import { UnreadMessagesProvider } from '@/src/context/UnreadMessagesContext';
import { useInAppUpdates } from '@/src/hooks/useInAppUpdates';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <>
      {/* App screens are light-themed; keep system icons dark for contrast. */}
      <StatusBar style="dark" />
      <AppShell />
    </>
  );
}

function AppShell() {
  const { required, starting, onUpdateNow } = useInAppUpdates();

  return (
    <>
      <AuthProvider>
        <RoleSwitchProvider>
          <UnreadMessagesProvider>
            <AdminNotificationsProvider>
              <LocationProvider>
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="index" />
                  <Stack.Screen name="(auth)" />
                  <Stack.Screen name="onboarding" />
                  <Stack.Screen name="(buyer)" />
                  <Stack.Screen name="(seller)" />
                </Stack>
              </LocationProvider>
            </AdminNotificationsProvider>
          </UnreadMessagesProvider>
        </RoleSwitchProvider>
      </AuthProvider>
      <AppUpdateModal
        visible={required}
        starting={starting}
        onUpdateNow={onUpdateNow}
      />
    </>
  );
}
