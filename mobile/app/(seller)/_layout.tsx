import { Stack } from 'expo-router';

export default function SellerLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="add-product" />
      <Stack.Screen name="edit-product/[id]" />
      <Stack.Screen name="products/[id]" />
      <Stack.Screen name="messages/[id]" />
    </Stack>
  );
}
