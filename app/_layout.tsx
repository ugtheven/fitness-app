import '../global.css';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { initDatabase } from '../lib/database';

export default function RootLayout() {
  useEffect(() => {
    initDatabase().catch(console.error);
  }, []);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#000000' },
      }}
    />
  );
}
