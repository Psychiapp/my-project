import { Redirect } from 'expo-router';

export default function Index() {
  // Always show the welcome/home screen first
  return <Redirect href="/(auth)/welcome" />;
}
