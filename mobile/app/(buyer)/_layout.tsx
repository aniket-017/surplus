import { Stack } from 'expo-router';

export default function BuyerLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="category/[name]" />
      <Stack.Screen name="products/[id]" />
      <Stack.Screen name="messages/[id]" />
      <Stack.Screen name="saved" />
      <Stack.Screen name="notifications" />
    </Stack>
  );
}
