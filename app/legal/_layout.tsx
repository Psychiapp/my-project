import { Stack } from 'expo-router';
import { PsychiColors } from '@/constants/theme';

export default function LegalLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: PsychiColors.white,
        },
        headerTintColor: PsychiColors.midnight,
        headerTitleStyle: {
          fontFamily: 'Georgia',
          fontWeight: '600',
        },
        headerShadowVisible: false,
        contentStyle: {
          backgroundColor: PsychiColors.cream,
        },
      }}
    />
  );
}
