import { useAuth } from "@clerk/expo";
import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

export default function Index() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color="#ea7a53" />
      </View>
    );
  }

  return <Redirect href={isSignedIn ? "/(tab)" : "/(auth)/sign-in"} />;
}
