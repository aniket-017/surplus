import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useTabScreenOptions } from '@/src/constants/tabBar';

export default function SellerTabsLayout() {
  const screenOptions = useTabScreenOptions();

  return (
    <Tabs screenOptions={screenOptions}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Listings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
