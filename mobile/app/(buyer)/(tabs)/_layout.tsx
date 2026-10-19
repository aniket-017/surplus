import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { BuyerSellTabButton } from '@/src/components/buyer/BuyerSellTabButton';
import { useTabSafeAreaInsets, useTabScreenOptions } from '@/src/constants/tabBar';
import { useUnreadMessages } from '@/src/context/UnreadMessagesContext';

export default function BuyerTabsLayout() {
  const screenOptions = useTabScreenOptions();
  const safeAreaInsets = useTabSafeAreaInsets();
  const { unreadCount } = useUnreadMessages();

  return (
    <Tabs screenOptions={screenOptions} safeAreaInsets={safeAreaInsets}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="sell"
        options={{
          title: 'Sell',
          tabBarButton: (props) => <BuyerSellTabButton {...props} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubble-outline" size={size} color={color} />
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
