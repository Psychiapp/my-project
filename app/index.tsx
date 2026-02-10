import { Redirect } from 'expo-router';

// This is the entry point - always redirect to welcome
export default function Index() {
  return <Redirect href="/(auth)/welcome" />;
}
