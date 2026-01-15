import { Stack } from 'expo-router';
import { PsychiColors } from '@/constants/theme';

export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: PsychiColors.cream },
      }}
    >
      <Stack.Screen name="edit-profile" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="privacy" />
      <Stack.Screen name="help" />
    </Stack>
  );
}
