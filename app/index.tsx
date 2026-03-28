import { View, Text } from 'react-native';

export default function HomeScreen() {
  return (
    <View className="flex-1 bg-background items-center justify-center">
      <Text className="text-foreground text-2xl font-bold">Fitness App</Text>
      <Text className="text-muted-foreground text-sm mt-2">Start your journey</Text>
    </View>
  );
}
