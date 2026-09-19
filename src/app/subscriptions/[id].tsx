import { Link, useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";

const SubscriptionDetails = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <View>
      <Text>Sub:{id}</Text>
      <Link href="/subscriptions">Go back</Link>
    </View>
  );
};

export default SubscriptionDetails;
