import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function LifeBuddyRedirectScreen() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/(tabs)');
  }, [router]);

  return null;
}
